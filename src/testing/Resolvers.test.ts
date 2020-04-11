import { Connection } from "typeorm";

import { graphqlTestCall } from "./graphqlTestCall";
import { createTestConn } from "./createTestConn";
import { UserEntity } from "../entity/User";
import { UserSettingsEntity } from "../entity/UserSettings";
import faker from "faker";

const registerMutation = `
mutation Register($email: String!, $password: String!) {
  register(data: { email: $email, password: $password }) {
    accessToken
    user {
      id
      email
      userSettingsId
      userSettings {
        theme
      }
    }
  }
}
`;

const loginMutation = `
mutation Login($email: String!, $password: String!) {
  login(data: { email: $email, password: $password }) {
    accessToken
    user {
      email
      id
      userSettingsId
      userSettings{
        theme
      }
    }
  }
}

`;

const meQuery = `
query Me {
  me{
    user{
      email
      id
      userSettingsId
      userSettings{
        theme
      }
    }
  }
}
`;

const revokeRefreshTokensForUserMutation = `
mutation RevokeRefreshTokensForUser($userId: Int!) {
    revokeRefreshTokensForUser(userId:$userId)
}
`;

const logoutMutation = `
mutation Logout{
    logout
}`;

const updateThemeMutation = `
mutation updateTheme($id: Int!, $theme:String!) {
  updateTheme(id: $id, theme: $theme) {
    theme
  }
}
`;

const addCategoryMutation = `
mutation AddCategory($name: String!){
  addCategory(name:$name)
}
`;
const getUserCategoriesQuery = `
{
  getUserCategories{
    categories{
      name
      id
    }
  }
}
`;

const updateCategoryMutation = `
mutation UpdateCategory($categoryId:Int!, $name: String!){
  updateCategory(categoryId:$categoryId, name:$name)
}
`;

const deleteCategoryMutation = `
mutation DeleteCategory($categoryId: Int!){
  deleteCategory(categoryId:$categoryId)
}`;

let conn: Connection;

beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  await conn.close();
});

describe("resolvers", () => {
  it("Working: register, login, and me", async () => {
    const testUser = { email: "test1@test.com", password: "test" };

    const registerResponse = await graphqlTestCall(registerMutation, {
      email: testUser.email,
      password: testUser.password,
    });

    expect(registerResponse!.data!.register.user).toEqual({
      id: 1,
      email: "test1@test.com",
      userSettings: {
        theme: "dark",
      },
      userSettingsId: 1,
    });
    expect(registerResponse!.data!.register.user.userSettings).toEqual({
      theme: "dark",
    });
    expect(registerResponse!.data!.register.accessToken).toBeDefined();

    const dbUser = await UserEntity.findOne({
      where: { email: testUser.email },
    });

    expect(dbUser).toBeDefined();

    const loginResponse = await graphqlTestCall(loginMutation, {
      email: testUser.email,
      password: testUser.password,
    });

    expect(loginResponse!.data!.login.user).toEqual({
      id: 1,
      email: "test1@test.com",
      userSettings: {
        theme: "dark",
      },
      userSettingsId: 1,
    });
    expect(loginResponse!.data!.login.user.userSettings).toEqual({
      theme: "dark",
    });
    expect(loginResponse!.data!.login.accessToken).toBeDefined();

    let accessToken: string = loginResponse!.data!.login.accessToken;

    const meResponse = await graphqlTestCall(meQuery, {}, accessToken);

    expect(meResponse!.data!.me).toEqual({
      user: {
        id: dbUser!.id,
        email: dbUser!.email,
        userSettingsId: 1,
        userSettings: {
          theme: "dark",
        },
      },
    });
  }),
    it("tests revokeRefreshToken resolver", async () => {
      const testUser = { email: "test2@test.com.com", password: "test" };

      const registerResponse = await graphqlTestCall(registerMutation, {
        email: testUser.email,
        password: testUser.password,
      });

      const userId = registerResponse!.data!.register.user.id;

      const userDb = await UserEntity.findOne(userId);
      expect(userDb?.tokenVersion).toEqual(0);

      const response = await graphqlTestCall(
        revokeRefreshTokensForUserMutation,
        { userId }
      );
      expect(response!.data!.revokeRefreshTokensForUser).toEqual(true);

      const updatedUserDb = await UserEntity.findOne(userId);
      expect(updatedUserDb?.tokenVersion).toEqual(1);
    }),
    it("tests logout mutation", async () => {
      const response = await graphqlTestCall(logoutMutation, {});

      expect(response!.data!.logout).toEqual(true);
    });
});

describe("userSettingsResolver", () => {
  it("Update Theme mutation", async () => {
    const testUser = { email: "test3@test.com", password: "test" };

    const registerResponse = await graphqlTestCall(registerMutation, {
      email: testUser.email,
      password: testUser.password,
    });

    const userId = registerResponse!.data!.register.user.id;
    const userSettingsId = registerResponse!.data!.register.user.userSettingsId;
    const theme = registerResponse!.data!.register.user.userSettings.theme;
    const accessToken = registerResponse!.data!.register.accessToken;

    expect(userId).toEqual(3);
    expect(userSettingsId).toEqual(3);
    expect(theme).toEqual("dark");
    expect(accessToken).toBeDefined();

    const updateThemeResponse = await graphqlTestCall(
      updateThemeMutation,
      {
        id: userSettingsId,
        theme: "light",
      },
      accessToken
    );

    expect(updateThemeResponse!.data!.updateTheme.theme).toEqual("light");

    const updateUserSettingsDb = await UserSettingsEntity.findOne(
      userSettingsId
    );

    expect(updateUserSettingsDb?.theme).toEqual("light");
  });
});

//##############################  Category Resovler tests  #############################
describe("Category Resolver Tests", () => {
  it("tests category CRUD", async () => {
    const testUser = { email: faker.internet.email(), password: "test" };

    const registerResponse = await graphqlTestCall(registerMutation, {
      email: testUser.email,
      password: testUser.password,
    });

    const userId = registerResponse!.data!.register.user.id;
    const accessToken = registerResponse!.data!.register.accessToken;

    expect(userId).toBeDefined();
    expect(accessToken).toBeDefined();
    //Create
    const addCategoryResponse = await graphqlTestCall(
      addCategoryMutation,
      {
        name: "test",
      },
      accessToken
    );
    expect(addCategoryResponse!.data!.addCategory).toEqual(true);
    //Read
    const user = await graphqlTestCall(getUserCategoriesQuery, {}, accessToken);

    const userData = user!.data!.getUserCategories;
    expect(userData.categories).toEqual([{ name: "test", id: 1 }]);

    let userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });
    expect(userDb?.categories).toEqual([{ id: 1, name: "test", userId: 4 }]);

    //Update
    const updateResponse = await graphqlTestCall(
      updateCategoryMutation,
      { categoryId: 1, name: "updated test" },
      accessToken
    );
    expect(updateResponse!.data!.updateCategory).toEqual(true);

    userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });
    expect(userDb?.categories).toEqual([
      { id: 1, name: "updated test", userId: 4 },
    ]);

    //Delete
    const deleteResponse = await graphqlTestCall(
      deleteCategoryMutation,
      { categoryId: 1 },
      accessToken
    );
    expect(deleteResponse!.data!.deleteCategory).toEqual(true);

    userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });
    expect(userDb?.categories).toEqual([]);
  });
});
