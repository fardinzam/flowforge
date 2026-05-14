type UserFactoryInput = {
  id?: string;
  email?: string;
  name?: string;
};

export type TestUser = {
  id: string;
  email: string;
  name: string;
};

export function createUserFactory(input: UserFactoryInput = {}): TestUser {
  return {
    id: input.id ?? "user_1",
    email: input.email ?? "developer@example.com",
    name: input.name ?? "Developer",
  };
}
