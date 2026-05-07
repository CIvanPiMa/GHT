import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import packageJson from 'src/../package.json';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ght-about-menu',
  templateUrl: 'about.html',
  styleUrls: ['../menu.scss', 'about.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutMenuComponent {

  @Output() closed = new EventEmitter();
  version = packageJson.version;

  async forceUpdate() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const keyList = await caches.keys();
      await Promise.all(keyList.map(async (key) => await caches.delete(key)));
    }

    window.location.reload();
  }
}
