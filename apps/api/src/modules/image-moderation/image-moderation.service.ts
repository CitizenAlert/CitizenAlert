import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MODERATION_EXPO_PUBLIC_API_URL = 'https://api.openai.com/v1/moderations';
const MODERATION_MODEL = 'omni-moderation-latest';

export interface ModerationResult {
  allowed: boolean;
  message?: string;
}

export interface RelevanceResult {
  relevant: boolean;
  message?: string;
}

const CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const VISION_MODEL = 'gpt-4o-mini';

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Vérifie si l'image contient du contenu interdit (pornographie, violence, etc.)
   * via l'API OpenAI Moderation (gratuite). Si OPENAI_API_KEY est absent ou
   * IMAGE_MODERATION_ENABLED=false, la modération est ignorée (allowed = true).
   */
  async checkImage(buffer: Buffer, mimeType: string): Promise<ModerationResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const enabled = this.config.get<string>('IMAGE_MODERATION_ENABLED', 'true');
    if (!apiKey || enabled === 'false') {
      this.logger.log(
        'Modération ignorée (OPENAI_API_KEY absente ou IMAGE_MODERATION_ENABLED=false)',
      );
      return { allowed: true };
    }

    this.logger.log("Appel de l'API OpenAI Moderation pour vérifier l'image...");
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64}`;

    try {
      const res = await fetch(MODERATION_EXPO_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODERATION_MODEL,
          input: [
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenAI Moderation API error ${res.status}: ${errBody}`);
      }

      const data = (await res.json()) as {
        results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }>;
      };
      const result = data.results?.[0];
      if (!result) {
        this.logger.log('API Moderation: pas de résultat, image autorisée');
        return { allowed: true };
      }
      if (!result.flagged) {
        this.logger.log('API Moderation: image autorisée (aucun contenu interdit détecté)');
        return { allowed: true };
      }

      const categories = result.categories ?? {};
      const triggered = Object.entries(categories)
        .filter(([, v]) => v)
        .map(([k]) => k);
      this.logger.warn(
        `API Moderation: image refusée (catégories: ${triggered.join(', ')})`,
      );
      const message = this.getUserMessage(triggered);
      return { allowed: false, message };
    } catch (err) {
      this.logger.warn(
        `Échec appel API Moderation (image autorisée par défaut): ${(err as Error).message}`,
      );
      return { allowed: true };
    }
  }

  /**
   * Vérifie si l'image est pertinente par rapport au type d'incident et à la description
   * (API OpenAI Vision, modèle gpt-4o-mini). Coût par appel selon usage OpenAI.
   * Désactivable avec IMAGE_RELEVANCE_CHECK_ENABLED=false.
   */
  async checkRelevance(
    buffer: Buffer,
    mimeType: string,
    incidentType: string,
    description: string,
  ): Promise<RelevanceResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const enabled = this.config.get<string>('IMAGE_RELEVANCE_CHECK_ENABLED', 'true');
    if (!apiKey || enabled === 'false') {
      this.logger.log(
        "Vérification de pertinence ignorée (clé absente ou IMAGE_RELEVANCE_CHECK_ENABLED=false)",
      );
      return { relevant: true };
    }

    const model = this.config.get<string>('OPENAI_VISION_MODEL', VISION_MODEL);
    const typeLabel = incidentType.replace(/_/g, ' ');
    const prompt = `Tu es un vérificateur pour une application de signalement d'incidents (voirie, équipements, nuisances). 
Type d'incident signalé : "${typeLabel}".
Description fournie par l'utilisateur : "${description}".

Regarde l'image fournie. L'image doit illustrer un problème ou une situation en rapport avec ce type d'incident et cette description (ex. dégât, panne, danger, dégradation). 
Si l'image montre quelque chose de totalement hors-sujet (paysage générique, selfie, meme, pub, autre type de problème), elle n'est pas pertinente.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, avec exactement ces clés :
- "relevant" : true si l'image illustre bien le type d'incident et la description, false sinon.
- "reason" : une courte phrase en français expliquant pourquoi (surtout si relevant est false).`;

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64}`;

    this.logger.log(`Appel API Vision (${model}) pour vérifier la pertinence de l'image...`);
    try {
      const res = await fetch(CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 200,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        if (res.status === 429) {
          this.logger.warn("API Vision: 429 (limite), on autorise l'image");
          return { relevant: true };
        }
        throw new Error(`OpenAI Chat API error ${res.status}: ${errBody}`);
      }

      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        this.logger.warn('API Vision: réponse vide, image autorisée');
        return { relevant: true };
      }

      const parsed = JSON.parse(raw) as { relevant?: boolean; reason?: string };
      const relevant = parsed.relevant !== false;
      if (relevant) {
        this.logger.log('API Vision: image jugée pertinente');
        return { relevant: true };
      }
      const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : undefined;
      this.logger.warn(`API Vision: image non pertinente - ${reason ?? 'aucune raison'}`);
      return {
        relevant: false,
        message:
          reason ||
          "L'image ne correspond pas au type d'incident ou à la description indiqués. Merci d'envoyer une photo du problème signalé.",
      };
    } catch (err) {
      this.logger.warn(
        `Échec vérification pertinence (image autorisée par défaut): ${(err as Error).message}`,
      );
      return { relevant: true };
    }
  }

  private getUserMessage(categories: string[]): string {
    if (categories.some((c) => c.startsWith('sexual'))) {
      return "Cette image n'est pas autorisée (contenu inapproprié).";
    }
    if (
      categories.some((c) => c.includes('violence') || c.includes('self-harm'))
    ) {
      return "Cette image n'est pas autorisée (contenu violent ou inapproprié).";
    }
    if (categories.some((c) => c.includes('harassment') || c.includes('hate'))) {
      return "Cette image n'est pas autorisée (contenu inapproprié).";
    }
    return "Cette image n'est pas autorisée pour un signalement.";
  }
}
