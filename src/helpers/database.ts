import { FirebaseApp, initializeApp } from 'firebase/app';
import { child, Database, get, getDatabase, ref, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database

  constructor() {
    try{
      this.app = initializeApp({
        ...conf.firebase
      })

      const auth = getAuth();
      signInWithEmailAndPassword(auth, conf.authFirebase.email, conf.authFirebase.password)
        .catch((error) => {
          console.log(error)
        })

      this.db = getDatabase(this.app);

    } catch(err) {
      console.error('Application works without database!!');
      console.error(err);
    }
  }

  //получение всех юзеров для оповещения
  getUsers(): Promise<Collection<User>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'users'))
        .then(snapshot => resolve(snapshot.val()))
        .catch(err => reject(err))
    })
  }
  //добавление слушателя оповещений
  //подписка на обновления объявлений

}

const db = new DatabaseService();
export default db;

export interface Collection<T> {
  [key: string]: T
}

export interface User {
  id: number,
  is_bot: boolean,
  firstname: string,
  username: string
}
