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