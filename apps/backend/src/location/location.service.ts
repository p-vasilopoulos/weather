import { Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';

import { WeatherDataSource } from '../database/weather-data-source';
import { Location } from './models/location.entity';
import { Weather } from './models/weather.entity';

@Injectable()
export class LocationService {
  private locationRepository: Repository<Location>;
  private weatherRepository: Repository<Weather>;
  constructor() {
    this.locationRepository = WeatherDataSource.getRepository(Location);
    this.weatherRepository = WeatherDataSource.getRepository(Weather);
  }

  async getLocationIds(search?: string): Promise<string[]> {
    return (
      search
        ? await this.locationRepository.findBy({
            id: Like(`%${search}%`),
          })
        : await this.locationRepository.find()
    ).map((location: Location) => location.id);
  }

  async getLocationWeather(
    locationId: string,
    startTime: Date,
    endTime?: Date,
  ): Promise<Location> {
    let locationWeatherQuery = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.weather', 'weather')
      .where('location.id = :locationId', { locationId: locationId })
      .andWhere('weather.dateTime > :startTime', {
        startTime: startTime,
      });

    if (endTime) {
      locationWeatherQuery = locationWeatherQuery.andWhere(
        'weather.dateTime < :endTime',
        {
          endTime: endTime,
        },
      );
    }

    return await locationWeatherQuery.getOne();
  }
}
