import {signal, computed, effect, model, input} from './utils/signal.utils.ts';

interface User {
  name: string;
  role: 'admin' | 'user';
}

export class Test {


// Работает строгая типизация объектов
  currentUser = signal<User>({name: 'Игорь', role: 'user'});
  isLogged = signal<boolean>(true);
  input = input<string>('saa');
  model = model<string>('s');
  computed = computed(()=> {
    return this.isLogged() + ' asdsd ' + this.currentUser().name
  });

// Автоматический вывод типа: ComputedSignal<string>
  adminPanelStatus = computed(() => {
    if (this.isLogged() && this.currentUser().role === 'admin') {
      return `Доступ разрешен для ${this.currentUser().name}`;
    }
    return 'Доступ ограничен';
  });

  constructor() {
    // Эффект реагирует только на те сигналы, которые прошли по ветке условий
    effect(() => {
      console.log(`[UI Guard]: ${this.adminPanelStatus()}`);
    });
    // effect(() => {
    //   const currentName = this.isLogged(); // Тут подписка сработает
    //
    //   setTimeout(() => {
    //     console.log(this.model()); // ОШИБКА: Подписка НЕ сработает!
    //   }, 1000);
    // });
    setTimeout(()=>{
      this.model.set('fff')
    },2000)
  }

  ngOnInit() {
    this.currentUser.update(user => ({...user, role: 'admin'}));
    setTimeout(()=>{
      // console.log('//////////////')
      // console.log(this.adminPanelStatus())
      // this.currentUser.update(user => ({...user, role: 'user'}));
      // console.log(this.adminPanelStatus())
      // console.log(this.currentUser())
      // console.log(this.isLogged())
      // console.log(this.isLogged())
      // console.log(this.isLogged())
      // console.log(this.isLogged())
      // console.log(this.computed())
      // console.log(this.model())
      // console.log(this.input())
    }, 1000)
  }
}