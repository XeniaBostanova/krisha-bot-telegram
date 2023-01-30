import { FirebaseApp, initializeApp } from 'firebase/app';
import { child, Database, get, getDatabase, onChildAdded, ref, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database
  initSkip = true

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
  setUserListener(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, 'users/' + user.id), user)
        .then(() => resolve())
        .catch(err => reject(err))
    })
  }
  //подписка на обновления объявлений
  async updateAds(cb): Promise<void> {
    onChildAdded(ref(this.db, 'ads'), (snapshot) => {
      const data: Collection<Ad> = snapshot.val();

      //при первом запуске выводятся уже добавленные в БД поля
      //их пропускаем и следим только за новыми
      setTimeout(() => {
        this.initSkip = false;
      })
      if(this.initSkip) {
        return;
      }
      cb(data);
    })
  }

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

export interface Ad {
  title: string,
  owner: string,
  id: string,
  price: string,
  url: string
}
