class IdContainer {
  private id: number;

  private order?: number;

  constructor() {
    this.id = 1;
  }

  public getId(): number {
    return (this.order as number * 1000 + this.id++);
  }

  public init(order: number): void {
    this.order = order;
  }

  public getOrder(): number {
    return (this.order as number) % 10;
  }
}

export default IdContainer;
