import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AppService } from './app.service';

interface ValidateAdminCodeDto {
  adminCode: string;
}

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

  @Get('admin-setup')
  getAdminSetup(@Res() res: Response) {
    const htmlContent = this.loadTemplate('admin-setup.html');
    console.log('Serving admin-setup.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }

  @Get('shared-styles.css')
  getSharedStyles(@Res() res: Response) {
    const cssContent = this.loadTemplate('shared-styles.css');
    console.log('Serving shared-styles.css');
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.send(cssContent);
  }

  @Get('super-admin-login')
  getSuperAdminLogin(@Res() res: Response) {
    const htmlContent = this.loadTemplate('super-admin-login.html');
    console.log('Serving super-admin-login.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }

  @Get('super-admin')
  getSuperAdmin(@Res() res: Response) {
    const htmlContent = this.loadTemplate('super-admin.html');
    console.log('Serving super-admin.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }

  @Post('api/auth/validate-admin-code')
  validateAdminCode(@Body() dto: ValidateAdminCodeDto) {
    const validCode = process.env.SUPER_ADMIN_CODE;
    const isValid = dto.adminCode === validCode;
    console.log(`[AUTH] Admin code validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    return { valid: isValid };
  }
}
