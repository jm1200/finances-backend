import { Connection } from "typeorm";

import { graphqlTestCall } from "./graphqlTestCall";
import { createTestConn } from "./createTestConn";
import { UserEntity } from "../entity/User";
import { UserSettingsEntity } from "../entity/UserSettings";
import faker from "faker";
import * as testGraphql from "./mutations";
import { CategoryEntity } from "../entity/Category";

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

    const registerResponse = await graphqlTestCall(
      testGraphql.registerMutation,
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

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

    const loginResponse = await graphqlTestCall(testGraphql.loginMutation, {
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

    const meResponse = await graphqlTestCall(
      testGraphql.meQuery,
      {},
      accessToken
    );

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

      const registerResponse = await graphqlTestCall(
        testGraphql.registerMutation,
        {
          email: testUser.email,
          password: testUser.password,
        }
      );

      const userId = registerResponse!.data!.register.user.id;

      const userDb = await UserEntity.findOne(userId);
      expect(userDb?.tokenVersion).toEqual(0);

      const response = await graphqlTestCall(
        testGraphql.revokeRefreshTokensForUserMutation,
        { userId }
      );
      expect(response!.data!.revokeRefreshTokensForUser).toEqual(true);

      const updatedUserDb = await UserEntity.findOne(userId);
      expect(updatedUserDb?.tokenVersion).toEqual(1);
    }),
    it("tests logout mutation", async () => {
      const response = await graphqlTestCall(testGraphql.logoutMutation, {});

      expect(response!.data!.logout).toEqual(true);
    });
});

describe("userSettingsResolver", () => {
  it("Update Theme mutation", async () => {
    const testUser = { email: "test3@test.com", password: "test" };

    const registerResponse = await graphqlTestCall(
      testGraphql.registerMutation,
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

    const userId = registerResponse!.data!.register.user.id;
    const userSettingsId = registerResponse!.data!.register.user.userSettingsId;
    const theme = registerResponse!.data!.register.user.userSettings.theme;
    const accessToken = registerResponse!.data!.register.accessToken;

    expect(userId).toEqual(3);
    expect(userSettingsId).toEqual(3);
    expect(theme).toEqual("dark");
    expect(accessToken).toBeDefined();

    const updateThemeResponse = await graphqlTestCall(
      testGraphql.updateThemeMutation,
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

    const registerResponse = await graphqlTestCall(
      testGraphql.registerMutation,
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

    const userId = registerResponse!.data!.register.user.id;
    const accessToken = registerResponse!.data!.register.accessToken;

    expect(userId).toBeDefined();
    expect(accessToken).toBeDefined();
    //Create
    const addCategoryResponse = await graphqlTestCall(
      testGraphql.addCategoryMutation,
      {
        name: "test",
      },
      accessToken
    );

    expect(addCategoryResponse!.data!.addCategory).toEqual(true);

    //Read
    const categories = await graphqlTestCall(
      testGraphql.getUserCategoriesQuery,
      {},
      accessToken
    );
    const categoriesData = categories!.data!.getUserCategories;
    console.log(categoriesData);
    expect(categoriesData).toEqual([
      { name: "Kids", id: 20 },
      { name: "Rental Property A", id: 17 },
      { name: "Home", id: 18 },
      { name: "test", id: 21 },
      { name: "Food", id: 19 },
      { name: "Income", id: 16 },
    ]);

    let userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });
    expect(userDb?.categories).toBeDefined();

    //Update
    const updateResponse = await graphqlTestCall(
      testGraphql.updateCategoryMutation,
      { categoryId: 21, name: "updated test" },
      accessToken
    );
    expect(updateResponse!.data!.updateCategory).toEqual(true);

    userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });

    expect(userDb?.categories).toBeDefined();
    const updatedCategory = userDb!.categories.filter((cat) => cat.id == 21);
    expect(updatedCategory[0].name).toEqual("updated test");

    //Add Sub Category
    const addSubCatResponse = await graphqlTestCall(
      testGraphql.addSubCategoryMutation,
      { categoryId: 21, name: "test sub cat" },
      accessToken
    );
    expect(addSubCatResponse!.data!.addSubCategory).toEqual(true);

    let categoryDb = await CategoryEntity.findOne(21, {
      relations: ["subCategories"],
    });

    expect(categoryDb!.subCategories).toEqual([
      {
        id: 85,
        name: "test sub cat",
        categoryId: 21,
        userId: 4,
      },
    ]);

    //Delete Sub Category
    const deleteSubCatResponse = await graphqlTestCall(
      testGraphql.deleteSubCategoryMutation,
      { subCategoryId: 85 },
      accessToken
    );

    expect(deleteSubCatResponse!.data!.deleteSubCategory).toEqual(true);
    categoryDb = await CategoryEntity.findOne(21, {
      relations: ["subCategories"],
    });

    expect(categoryDb!.subCategories).toEqual([]);

    // Delete Category
    const deleteResponse = await graphqlTestCall(
      testGraphql.deleteCategoryMutation,
      { categoryId: 21 },
      accessToken
    );
    expect(deleteResponse!.data!.deleteCategory).toEqual(true);

    categoryDb = await CategoryEntity.findOne(21);
    expect(categoryDb).toBeUndefined();
  });
});
