import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  private loadTemplate(filename: string): string {
    try {
      // Try from dist directory (production)
      const distPath = join(__dirname, '..', 'templates', filename);
      return readFileSync(distPath, 'utf-8');
    } catch (err) {
      try {
        // Fallback to src directory (development)
        const srcPath = join(__dirname, 'templates', filename);
        return readFileSync(srcPath, 'utf-8');
      } catch (err2) {
        throw new Error(`Template ${filename} not found`);
      }
    }
  }

  @Get()
  getIndex(@Res() res: Response) {
    const htmlContent = this.loadTemplate('index.html');
    console.log('Serving index.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }

  @Get('privacy-policy')
  getPrivacyPolicy(@Res() res: Response) {
    const htmlContent = this.loadTemplate('privacy-policy.html');
    console.log('Serving privacy-policy.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }
}
