import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private loadTemplate(filename: string): string {
    const distPath = join(__dirname, '..', '..', 'templates', filename);
    const srcPath = join(__dirname, '..', '..', 'templates', filename);
    
    try {
      return readFileSync(distPath, 'utf-8');
    } catch (err) {
      try {
        return readFileSync(srcPath, 'utf-8');
      } catch (err2) {
        throw new Error(`Template ${filename} not found at ${distPath}`);
      }
    }
  }

  @Get('cities')
  async getCitiesStats() {
    return this.analyticsService.getCitiesHazardStats();
  }

  @Get('cities-visualization')
  getCitiesVisualization(@Res() res: Response) {
    const htmlContent = this.loadTemplate('cities-visualization.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }
}
