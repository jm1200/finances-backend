import { Connection } from "typeorm";

import { graphqlTestCall } from "./graphqlTestCall";
import { createTestConn } from "./createTestConn";
import { UserEntity } from "../entity/User";
import { UserSettingsEntity } from "../entity/UserSettings";
import faker from "faker";
import * as testGraphql from "./mutations";
import { CategoryEntity } from "../entity/Category";
import { SubCategoryEntity } from "../entity/SubCategory";

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
      id: expect.any(String),
      email: "test1@test.com",
      userSettings: {
        theme: "dark",
      },
      userSettingsId: expect.any(String),
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
      id: expect.any(String),
      email: "test1@test.com",
      userSettings: {
        theme: "dark",
      },
      userSettingsId: expect.any(String),
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
        userSettingsId: expect.any(String),
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

    expect(userId).toBeDefined();
    expect(userSettingsId).toEqual(expect.any(String));
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
    //console.log(categoriesData);
    expect(categoriesData).toEqual([
      { name: expect.any(String), id: expect.any(String) },
      { name: expect.any(String), id: expect.any(String) },
      { name: expect.any(String), id: expect.any(String) },
      { name: expect.any(String), id: expect.any(String) },
      { name: expect.any(String), id: expect.any(String) },
      { name: expect.any(String), id: expect.any(String) },
    ]);

    let userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });
    expect(userDb?.categories).toBeDefined();

    //Update
    const dbCategory = await CategoryEntity.findOne({
      where: { name: "test" },
    });
    expect(dbCategory).toBeDefined();
    const updateResponse = await graphqlTestCall(
      testGraphql.updateCategoryMutation,
      { categoryId: dbCategory!.id, name: "updated test" },
      accessToken
    );
    expect(updateResponse!.data!.updateCategory).toEqual(true);

    userDb = await UserEntity.findOne(userId, {
      relations: ["categories"],
    });

    expect(userDb?.categories).toBeDefined();
    const updatedCategory = userDb!.categories.filter(
      (cat) => cat.id == dbCategory!.id
    );
    expect(updatedCategory[0].name).toEqual("updated test");

    //Add Sub Category
    const addSubCatResponse = await graphqlTestCall(
      testGraphql.addSubCategoryMutation,
      { categoryId: dbCategory!.id, name: "test sub cat" },
      accessToken
    );
    expect(addSubCatResponse!.data!.addSubCategory).toEqual(true);

    let categoryDb = await CategoryEntity.findOne({
      where: { name: "updated test" },
      relations: ["subCategories"],
    });

    expect(categoryDb!.subCategories).toEqual([
      {
        id: expect.any(String),
        name: "test sub cat",
        categoryId: expect.any(String),
        userId: expect.any(String),
      },
    ]);

    //Delete Sub Category
    const dbSubCategory = await SubCategoryEntity.findOne({
      where: { name: "test sub cat" },
    });
    expect(dbSubCategory).toBeDefined();
    const deleteSubCatResponse = await graphqlTestCall(
      testGraphql.deleteSubCategoryMutation,
      { subCategoryId: dbSubCategory!.id },
      accessToken
    );

    expect(deleteSubCatResponse!.data!.deleteSubCategory).toEqual(true);
    categoryDb = await CategoryEntity.findOne({
      where: { name: "updated test" },
      relations: ["subCategories"],
    });

    expect(categoryDb!.subCategories).toEqual([]);

    // Delete Category
    const deleteResponse = await graphqlTestCall(
      testGraphql.deleteCategoryMutation,
      { categoryId: dbCategory!.id },
      accessToken
    );
    expect(deleteResponse!.data!.deleteCategory).toEqual(true);

    categoryDb = await CategoryEntity.findOne({
      where: { name: "updated test" },
    });
    expect(categoryDb).toBeUndefined();
  });
});
