import { ErrorHandler, Injectable } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';

@Injectable()
export class GhsErrorHandler extends ErrorHandler {

  override handleError(error: Error) {
    gameManager.stateManager.errorLog.push(error);
    super.handleError(error);

    if (window.document.body.classList.contains('working') || window.document.body.classList.contains('server-sync')) {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }
}
