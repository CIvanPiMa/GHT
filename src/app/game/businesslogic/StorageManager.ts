import { GameModel } from 'src/app/game/model/Game';
import { Settings } from 'src/app/game/model/Settings';

export class StorageManager {
  db: IDBDatabase | undefined;

  async init(): Promise<any> {
    const persistent = await navigator.storage.persist();
    if (!persistent) {
      console.warn('Storage may be cleared by the UA under storage pressure.');
    }

    return new Promise<any>((resolve, reject) => {
      if (window.indexedDB) {
        const request: IDBOpenDBRequest = window.indexedDB.open('ght-db', 1);

        request.onupgradeneeded = (event: any) => {
          console.debug('Upgrade DB', event);
          const db = event.target.result;
          if (event.oldVersion < 1) {
            db.createObjectStore('game');
            db.createObjectStore('settings');
            db.createObjectStore('undo', { autoIncrement: true });
            db.createObjectStore('redo', { autoIncrement: true });
            db.createObjectStore('undo-infos', { autoIncrement: true });
            db.createObjectStore('game-backup', { autoIncrement: true });
          }
        };

        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          // migration
          if (localStorage.getItem('ght-game')) {
            this.migrate();
          }
          resolve(true);
        };

        request.onerror = (event: any) => {
          this.db = undefined;
          console.error('db error', request.error, event);
          console.warn('No IndexedDB, fallback to Local Storage');
          reject(false);
        };
      } else {
        this.db = undefined;
        console.warn('No IndexedDB, fallback to Local Storage');
        reject(false);
      }
    });
  }

  writeGameModel(gameModel: GameModel): Promise<void> {
    return this.write('game', 'default', gameModel);
  }

  readGameModel(): Promise<GameModel> {
    return this.read<GameModel>('game', 'default');
  }

  addBackup(gameModel: GameModel) {
    if (this.db) {
      this.write('game-backup', undefined, gameModel);
    } else {
      let count = 1;
      let backup = localStorage.getItem('ght-game-backup-' + count);
      while (backup) {
        count++;
        backup = localStorage.getItem('ght-game-backup-' + count);
      }
      try {
        localStorage.setItem('ght-game-backup-' + count, JSON.stringify(gameModel));
      } catch (e) {
        console.error(e);
      }
    }
  }

  read<T>(store: string, key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.get(key);
        request.onsuccess = (event: any) => {
          const objec: T = event.target.result;
          resolve(objec);
        };

        request.onerror = (event: any) => {
          console.error('read ' + store + ' failed', event);
          reject(event);
        };
      } else {
        const local: string | null = localStorage.getItem('ght-' + store);
        if (local) {
          resolve(JSON.parse(local) as T);
        } else {
          reject(null);
        }
      }
    });
  }

  write(store: string, key: string | undefined, object: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.put(object, key);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (event: any) => {
          console.error('update ' + store + ' failed', event);
          reject();
        };
      } else {
        try {
          localStorage.setItem('ght-' + store, JSON.stringify(object));
          resolve();
        } catch (e) {
          console.error(e);
          reject();
        }
      }
    });
  }

  remove(store: string, key: string = 'default') {
    if (this.db) {
      const transaction = this.db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);
      request.onerror = (event: any) => {
        console.error('delete ' + key + ' from ' + store + ' failed', event);
      };
    } else {
      localStorage.removeItem('ght-' + store);
    }
  }

  readAll<T>(store: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAll();
        request.onsuccess = (event: any) => {
          const objects: T[] = event.target.result;
          resolve(objects);
        };

        request.onerror = (event: any) => {
          console.error('read ' + store + ' failed', event, event.error);
          reject(event);
        };
      } else {
        const local: string | null = localStorage.getItem('ght-' + store);
        if (local) {
          resolve(JSON.parse(local) as T[]);
        } else {
          reject(null);
        }
      }
    });
  }

  readList<T>(store: string, limit: number, offset: number, reverse: boolean = true): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, 'readonly');
        const objectStore = transaction.objectStore(store);
        const result: T[] = [];

        const request = objectStore.openCursor(null, 'prev');
        let hasSkipped = false;
        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (!hasSkipped && offset > 0) {
            hasSkipped = true;
            cursor.advance(offset);
            return;
          }
          if (cursor) {
            result.push(cursor.value);
            if (result.length < limit) {
              cursor.continue();
            } else {
              resolve(reverse ? result.reverse() : result);
            }
          } else {
            resolve(reverse ? result.reverse() : result);
          }
        };

        request.onerror = (event: any) => {
          console.error('read ' + store + ' failed', event);
          reject(event);
        };
      } else {
        const local: string | null = localStorage.getItem('ght-' + store);
        if (local) {
          resolve((JSON.parse(local) as T[]).slice(offset, offset + limit));
        } else {
          reject(null);
        }
      }
    });
  }

  async writeArray(store: string, objects: any[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.db) {
        try {
          // Use a single transaction to make clear+write atomic
          const transaction = this.db.transaction(store, 'readwrite');
          const objectStore = transaction.objectStore(store);

          // Clear all existing data
          await new Promise<void>((resolveInner, rejectInner) => {
            const clearRequest = objectStore.clear();
            clearRequest.onsuccess = () => resolveInner();
            clearRequest.onerror = () => rejectInner(clearRequest.error);
          });

          // Write all new objects in the same transaction
          for (let index = 0; index < objects.length; index++) {
            await new Promise<void>((resolveInner, rejectInner) => {
              const putRequest = objectStore.put(objects[index]);
              putRequest.onsuccess = () => resolveInner();
              putRequest.onerror = () => rejectInner(putRequest.error);
            });
          }

          // Wait for transaction to complete
          await new Promise<void>((resolveInner, rejectInner) => {
            transaction.oncomplete = () => resolveInner();
            transaction.onerror = () => rejectInner(transaction.error);
            transaction.onabort = () => rejectInner(new Error('Transaction aborted'));
          });

          resolve();
        } catch (e) {
          console.error(`Failed to writeArray to ${store}:`, e);
          reject(e);
        }
      } else {
        try {
          localStorage.setItem('ght-' + store, JSON.stringify(objects));
          resolve();
        } catch (e) {
          console.error(e);
          reject();
        }
      }
    });
  }

  clear(store: string | undefined = undefined): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        if (store) {
          const transaction = this.db.transaction(store, 'readwrite');
          const objectStore = transaction.objectStore(store);
          const request = objectStore.clear();
          request.onsuccess = () => {
            resolve();
          };
          request.onerror = (event: any) => {
            console.error('delete ' + store + ' failed', event);
            reject(request.error);
          };
        } else {
          const request = window.indexedDB.deleteDatabase('ght-db');
          request.onsuccess = () => {
            resolve();
          };
          request.onblocked = () => {
            setTimeout(() => {
              if (this.db) {
                this.db.close();
              }
            }, 1000);
          };
          request.onerror = (event: any) => {
            console.error("delete database 'ght-db' failed", event);
            reject(request.error);
          };
        }
      } else {
        if (store) {
          localStorage.removeItem('ght-' + store);
          resolve();
        } else {
          localStorage.clear();
          if (window.indexedDB) {
            const request = window.indexedDB.deleteDatabase('ght-db');
            request.onsuccess = () => {
              resolve();
            };
            request.onblocked = () => {
              setTimeout(() => {
                if (this.db) {
                  this.db.close();
                }
              }, 1000);
            };
            request.onerror = (event: any) => {
              console.error("delete database 'ght-db' failed", event);
              reject(request.error);
            };
          } else {
            resolve();
          }
        }
      }
    });
  }

  async datadump(migrate: boolean = false): Promise<any> {
    const datadump: any = {};
    if (this.db && !migrate) {
      datadump['game'] = await this.readGameModel();
      datadump['settings'] = await this.read('settings', 'default');
      datadump['undo'] = await this.readAll('undo');
      datadump['redo'] = await this.readAll('redo');
      datadump['undo-infos'] = await this.readAll('undo-infos');
      datadump['game-backup'] = await this.readAll('game-backup');
    } else {
      if (!migrate) {
        console.warn('No IndexedDB, fallback to Local Storage');
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const data = localStorage.getItem(key);
          if (data) {
            datadump[key] = JSON.parse(data);
          }
        }
      }
    }

    return Promise.resolve(datadump);
  }

  async migrate() {
    console.warn('Migration of old local storage');

    try {
      const datadump: any = await storageManager.datadump(true);
      const downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
      downloadButton.setAttribute('download', 'ght-migration-backup.json');
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    } catch {
      console.warn('Could not read datadump');
    }

    const gameString: string | null = localStorage.getItem('ght-game');
    if (gameString) {
      const game = JSON.parse(gameString);
      this.write('game', 'default', game)
        .then(() => {
          localStorage.removeItem('ght-game');
        })
        .catch();
    }

    const settingsString: string | null = localStorage.getItem('ght-settings');
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      this.write('settings', 'default', Object.assign(new Settings(), settings))
        .then(() => {
          localStorage.removeItem('ght-settings');
        })
        .catch();
    }

    const undoString: string | null = localStorage.getItem('ght-undo');
    if (undoString !== null) {
      const undos = JSON.parse(undoString);
      let count = 1;
      let additionalUndoString = localStorage.getItem('ght-undo-' + count);
      while (additionalUndoString) {
        const additionalUndo: GameModel[] = JSON.parse(additionalUndoString);
        undos.push(...additionalUndo);
        count++;
        additionalUndoString = localStorage.getItem('ght-undo-' + count);
      }

      this.writeArray('undo', undos)
        .then(() => {
          localStorage.removeItem('ght-undo');
          let additionalUndoString = localStorage.getItem('ght-undo-' + count);
          while (additionalUndoString) {
            localStorage.removeItem('ght-undo-' + count);
            count++;
            additionalUndoString = localStorage.getItem('ght-undo-' + count);
          }
        })
        .catch();
    }
    const redoString: string | null = localStorage.getItem('ght-redo');
    if (redoString !== null) {
      const redos = JSON.parse(redoString);
      let count = 1;
      let additionalRedoString = localStorage.getItem('ght-redo-' + count);
      while (additionalRedoString) {
        const additionalRedo: GameModel[] = JSON.parse(additionalRedoString);
        redos.push(...additionalRedo);
        count++;
        additionalRedoString = localStorage.getItem('ght-redo-' + count);
      }

      this.writeArray('redo', redos)
        .then(() => {
          localStorage.removeItem('ght-redo');
          let additionalRedoString = localStorage.getItem('ght-redo-' + count);
          while (additionalRedoString) {
            localStorage.removeItem('ght-redo-' + count);
            count++;
            additionalRedoString = localStorage.getItem('ght-redo-' + count);
          }
        })
        .catch();
    }

    const undoInfosString: string | null = localStorage.getItem('ght-undo-infos');
    if (undoInfosString !== null) {
      const undoInfos = JSON.parse(undoInfosString);
      let count = 1;
      let additionalUndoInfosString = localStorage.getItem('ght-undo-infos-' + count);
      while (additionalUndoInfosString) {
        const additionalUndoInfos: string[][] = JSON.parse(additionalUndoInfosString);
        undoInfos.push(...additionalUndoInfos);
        count++;
        additionalUndoInfosString = localStorage.getItem('ght-undo-infos-' + count);
      }

      this.writeArray('undo-infos', undoInfos)
        .then(() => {
          localStorage.removeItem('ght-undo-infos');
          let additionalUndoInfosString = localStorage.getItem('ght-undo-infos-' + count);
          while (additionalUndoInfosString) {
            localStorage.removeItem('ght-undo-infos-' + count);
            count++;
            additionalUndoInfosString = localStorage.getItem('ght-undo-infos-' + count);
          }
        })
        .catch();
    }

    let count = 1;
    let backup = localStorage.getItem('ght-game-backup-' + count);
    while (backup) {
      this.write('game-backup', undefined, backup)
        .then(() => {
          localStorage.removeItem('ght-game-backup-' + count);
        })
        .catch();
      count++;
      backup = localStorage.getItem('ght-game-backup-' + count);
    }
  }
}

export const storageManager: StorageManager = new StorageManager();
