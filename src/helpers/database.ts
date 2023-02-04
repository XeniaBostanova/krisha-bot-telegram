import { FirebaseApp, initializeApp } from 'firebase/app';
import { child, Database, get, getDatabase, onChildAdded, ref, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database
  initSkip = {}
  unsubscribers = []

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
  //подписка на обновления объявлений одного треда
  async updateAdsThread(key: string, callback): Promise<void> {
    this.initSkip[key] = true;
    const unsubscriber = onChildAdded(ref(this.db, 'ads/' + key), (snapshot) => {
      const data: Collection<Ad> = snapshot.val();

      console.log('updateAdsThread', key);

      //при первом запуске выводятся уже добавленные в БД поля
      //их пропускаем и следим только за новыми
      setTimeout(() => {
        this.initSkip[key] = false;
      })
      if(this.initSkip[key]) {
        return;
      }
      callback(data);
    })
    this.unsubscribers.push(unsubscriber);
  }

  //получение списка тредов (типов объявлений)
  getAllAdsThread(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.unsubscribers.forEach((unsubscriber) => unsubscriber());
      get(child(ref(this.db), 'ads'))
        .then((snapshot) => {
          const val = snapshot.val();
          return resolve(Object.keys(val));
        })
        .catch(err => reject(err))
    })
  }

  async updateAds(callback): Promise<void> {

    //подписка на список тредов и при его изменнии перезапрашивать его
    onChildAdded(ref(this.db, 'ads'),async () => {
      const keys = await this.getAllAdsThread();

      for (const key of keys) {
        console.log(key);

        //вызов подписки на каждый тред
        this.updateAdsThread(key, callback);

      }
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
  address: string,
  owner: string,
  id: string,
  price: string,
  url: string
}
