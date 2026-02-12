import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { HazardsService } from './hazards.service';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { UpdateHazardDto } from './dto/update-hazard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('hazards')
export class HazardsController {
  constructor(private readonly hazardsService: HazardsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createHazardDto: CreateHazardDto, @Request() req: any) {
    return this.hazardsService.create(createHazardDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.hazardsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.hazardsService.findActive();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') latitude: number,
    @Query('lon') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.hazardsService.findNearby(+latitude, +longitude, radius ? +radius : 10);
  }

  @Get('types')
  getTypes() {
    return this.hazardsService.getTypes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hazardsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHazardDto: UpdateHazardDto, @Request() req: any) {
    return this.hazardsService.update(id, updateHazardDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.hazardsService.remove(id, req.user.userId);
  }
}
