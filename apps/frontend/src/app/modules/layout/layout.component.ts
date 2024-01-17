import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, of, switchMap } from 'rxjs';
import { LocationService } from '../../shared/services/location.service';

@Component({
  selector: 'weather-layout-component',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit {
  centerSearchBar: boolean = true;

  searchInputControl = new UntypedFormControl();

  constructor(
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  readonly childActive$ = this.router.events.pipe(
    switchMap(() => of(this.route.children.length > 0)),
  );

  ngOnInit(): void {
    this.searchInputControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe((query) => {
        this.searchForLocations(query);
      });

    //Check if user has navigated to a child route and move the search bar accordingly
    this.router.events
      .pipe(switchMap(() => of(this.route.children.length > 0)))
      .subscribe((result) => {
        this.centerSearchBar = result ? false : true;
      });
  }

  getBackgroundImageClass() {
    return `bg-[url(assets/backgrounds/sunny-1.png)]`;
  }

  private searchForLocations(query: string) {
    console.log('Searching for : ' + query);
    this.locationService.getLocations(query).subscribe();
  }
}