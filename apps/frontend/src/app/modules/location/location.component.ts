import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  getLocalTimeZone,
  now,
  parseAbsolute,
  toCalendarDateTime,
} from '@internationalized/date';

import { Location } from '../../shared/models/location';
import { locationTimezoneMap } from '../../shared/models/location-timezone-map';
import { Weather } from '../../shared/models/weather';
import { LocationService } from '../../shared/services/location.service';
import { TranslocoService } from '@ngneat/transloco';
import { DatePipe } from '@angular/common';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsService } from '../../shared/services/settings.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'weather-location-component',
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
})
export class LocationComponent implements OnInit {
  currentIntervalId: number | null = null;
  time: Date = new Date(); // global variable for string interpolation on html

  searchInputControl = new UntypedFormControl();

  location: Location | null = null;
  currentTimezone: string | null = null;

  currentFontColorClass: string = 'text-white';
  currentTemperatureUnits: string = 'celsius';
  currentTimeFormat: number = 24;
  currentTheme: string = 'default';

  currentLocale: string = 'en-US';

  private unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private locationService: LocationService,
    private themeService: ThemeService,
    private translocoService: TranslocoService,
    private datePipe: DatePipe,
    private settingsService: SettingsService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      // Access individual route parameters using params.get('parameterName')
      const id = params.get('location-id');
      if (id) {
        this.currentTimezone = locationTimezoneMap[id];
        this.getLocationHourlyWeather(id);
      }
    });

    this.themeService.fontColorClass$.subscribe((fontColor: string) => {
      this.currentFontColorClass = fontColor;
    });

    this.settingsService.currentTemperatureUnits$.subscribe((units: string) => {
      this.currentTemperatureUnits = units;
    });

    this.settingsService.currentTimeFormat$.subscribe((format: number) => {
      this.currentTimeFormat = format;
    });
    this.settingsService.currentTheme$.subscribe((theme: string) => {
      this.currentTheme = theme;
    });

    this.translocoService.langChanges$
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(
        (newLanguage) =>
          (this.currentLocale =
            this.translocoService.getActiveLang() === 'en' ? 'en-US' : 'el-GR'),
      );
  }

  private getLocationHourlyWeather(locationId: string) {
    const localTime = now(getLocalTimeZone());
    setTimeout;
    this.locationService
      .getLocationWeather(
        locationId,
        localTime.subtract({ hours: 1 }).toAbsoluteString(),
        localTime.add({ hours: 6 }).toAbsoluteString(),
      )
      .subscribe((result) => {
        this.location = result;
        if (this.currentTimezone) {
          this.themeService.updateTheme(
            result.weather[0],
            this.currentTimezone,
          );

          this.initializeClock(this.currentTimezone);
        }
      });
  }

  initializeClock(timezone: string) {
    const convertedo = parseAbsolute(new Date().toISOString(), timezone);
    const heh = toCalendarDateTime(convertedo);

    this.time = new Date(heh.toString());

    if (this.currentIntervalId) {
      clearInterval(this.currentIntervalId);
    }

    this.currentIntervalId = window.setInterval(() => {
      const zonedDateTime = parseAbsolute(new Date().toISOString(), timezone);
      const calendarDateTime = toCalendarDateTime(zonedDateTime);

      this.time = new Date(calendarDateTime.toString());
    }, 1000);
  }

  getHighestLocationTemperature() {
    const temperatures = this.location?.weather.map(
      (weather: Weather) => weather.temperatureCelsius,
    );

    if (temperatures && temperatures.length > 0) {
      return this.getUnitAdjustedTemperature(Math.max(...temperatures));
    }
    return 0;
  }

  getLowestLocationTemperature() {
    const temperatures = this.location?.weather.map(
      (weather: Weather) => weather.temperatureCelsius,
    );

    if (temperatures && temperatures.length > 0) {
      return this.getUnitAdjustedTemperature(Math.min(...temperatures));
    }
    return 0;
  }

  getLocalTime(dateTime: Date) {
    if (this.currentTimezone) {
      const date = new Date(dateTime);

      const convertedo = parseAbsolute(
        date.toISOString(),
        this.currentTimezone,
      );
      const heh = toCalendarDateTime(convertedo);
      return new Date(heh.toString());
    }

    return;
  }

  getWeatherForecast() {
    const disruptiveConditions = [
      'thunderstorm',
      'showers',
      'heavy-rain',
      'snowy',
      'sleet',
    ];

    if (this.location) {
      const weather = [...this.location.weather];

      const disruptiveWeather = weather.find((weather: Weather) =>
        disruptiveConditions.includes(weather.weatherCondition),
      );

      if (!this.currentTimezone) {
        return;
      }

      if (disruptiveWeather) {
        const date = new Date(disruptiveWeather.dateTime);

        const zonedDateTime = parseAbsolute(
          date.toISOString(),
          this.currentTimezone,
        );
        const calendarDateTime = toCalendarDateTime(zonedDateTime);

        return `${this.translocoService.translate(
          'location.forecast.' + disruptiveWeather?.weatherCondition,
        )} ${this.currentTimeFormat === 24 ? this.datePipe.transform(new Date(calendarDateTime.toString()), 'H:mm') : this.datePipe.transform(new Date(calendarDateTime.toString()), 'h:mm a')}`;
      }

      const conditionOccurences = [
        { condition: 'clear', occurences: 0 },
        { condition: 'partly-cloudy', occurences: 0 },
        { condition: 'overcast', occurences: 0 },
        { condition: 'fog', occurences: 0 },
      ];

      weather.forEach((weather: Weather) => {
        const occurence = conditionOccurences.find(
          (conditionOccurence) =>
            conditionOccurence.condition === weather.weatherCondition,
        );
        if (occurence) {
          occurence.occurences++;
        }
      });

      const prevalentCondition = conditionOccurences.reduce((prev, current) => {
        return prev.occurences > current.occurences ? prev : current;
      });

      return `${this.translocoService.translate(
        'location.forecast.' + prevalentCondition.condition,
      )}`;
    }
    return;
  }

  getTimeAdjustedWeatherIconName(condition: string, dateTime: Date) {
    const hour = this.getLocalTime(dateTime)?.getHours();

    if (
      hour &&
      hour > 5 &&
      hour < 21 &&
      ['clear', 'partly-cloudy'].includes(condition)
    ) {
      return condition === 'clear' ? 'sunny' : 'partly-sunny';
    }

    return condition;
  }

  getUnitAdjustedTemperature(temperature: number) {
    return this.currentTemperatureUnits === 'celsius'
      ? Math.round(temperature)
      : Math.round((temperature * 9) / 5 + 32);
  }
}
