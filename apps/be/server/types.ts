export interface Route {
  path: string;
  method: string;
  handler: (r: Request) => Response | Promise<Response>;
}
