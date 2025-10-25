declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
  };
  
  interface Response {
    new (body?: BodyInit | null, init?: ResponseInit): Response;
  }
  
  interface Request {
    new (input: RequestInfo, init?: RequestInit): Request;
  }
}

export {};
