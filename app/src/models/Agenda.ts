interface IMessage {
  id:    number;
  title: string;
}

interface IAgenda {
  id:      number;
  parent?: number;
  owner?:  string;
  title?:  string;
  cron?: {
    active?: string;
    expire?: string;
  };
  messages?: IMessage[];
  children?: Array<IAgenda | number>;
}

export class Agenda {
  constructor() { }

  select(id: number): IAgenda {

  }

  insert(agenda: IAgenda): void {

  }

  update(agenda: IAgenda): void {

  }

  delete(id: number): void {
    
  }
}