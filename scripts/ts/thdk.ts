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

namespace thdk {
    export class Network {
        public static post(url:string, data:any): Promise<{}> {
            const deferred = new Deferred();

            // construct an HTTP request
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

            // send the collected data as JSON
            xhr.send(JSON.stringify(data));

            xhr.onloadend = function (data) {
                deferred.resolve(JSON.parse(xhr.response).data);
            };
 
            return deferred.promise;
        }
    }
}