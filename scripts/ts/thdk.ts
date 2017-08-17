namespace thdk{

    export interface IDeferred<T> {
        resolve(resolveWith: T): void;
        reject(rejectWith: T): void;
        promise: Promise<T>;
    }

    export class Deferred<T> implements IDeferred<T> {
        public resolve;
        public reject;
        public promise: Promise<T>;

        constructor() {
            this.promise = new Promise<T>((resolve, reject)=> {
              this.reject = reject
              this.resolve = resolve
            });
         }
    }   
}

namespace thdk.utils {
    export function findFirst<T>(arr: T[], predicate: (element: T, i: number, arr: T[]) => boolean): T {
		let result: T = null;
		arr.some(function (el, i) {
			return predicate(el, i, arr) ? ((result = el), true) : false;
		});
		return result;
    }
    
    export function findIndex<T>(arr: T[], predicate: (element: T, i: number, arr: T[]) => boolean): number {
		let index = -1;
		arr.some(function (el, i) {
			return predicate(el, i, arr) ? ((index = i), true) : false;
		});
		return index;
    }
    
    export function anyMatchInArray(target: string[], toMatch: string[]): boolean {    
        var found, targetMap, i, j, cur;
    
        found = false;
        targetMap = {};
    
        // Put all values in the `target` array into a map, where
        //  the keys are the values from the array
        for (i = 0, j = target.length; i < j; i++) {
            cur = target[i];
            targetMap[cur] = true;
        }
    
        // Loop over all items in the `toMatch` array and see if any of
        //  their values are in the map from before
        for (i = 0, j = toMatch.length; !found && (i < j); i++) {
            cur = toMatch[i];
            found = !!targetMap[cur];
            // If found, `targetMap[cur]` will return true, otherwise it
            //  will return `undefined`...that's what the `!!` is for
        }
    
        return found;
    };
}

namespace thdk {
    // TODO: use fech api here
    export class Network {
        public postAsync(url:string, data:any): Promise<{}> {
            const deferred = new Deferred();

            // construct an HTTP request
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

            // send the collected data as JSON
            xhr.send(JSON.stringify(data));

            xhr.onloadend = function (data) {
                deferred.resolve(JSON.parse(xhr.responseText));
            };
 
            return deferred.promise;
        }

        public getAsync<T>(url:string, auth: string): Promise<T> {
            const deferred = new Deferred<T>();

            // construct an HTTP request
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', auth);
                xhr.send();

            xhr.onloadend = function (data) {
                deferred.resolve(JSON.parse(xhr.responseText));
            };
 
            return deferred.promise;
        }
    }
}