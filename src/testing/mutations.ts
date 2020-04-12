export const registerMutation = `
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

export const loginMutation = `
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

export const meQuery = `
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

export const revokeRefreshTokensForUserMutation = `
mutation RevokeRefreshTokensForUser($userId: Int!) {
    revokeRefreshTokensForUser(userId:$userId)
}
`;

export const logoutMutation = `
mutation Logout{
    logout
}`;

export const updateThemeMutation = `
mutation updateTheme($id: Int!, $theme:String!) {
  updateTheme(id: $id, theme: $theme) {
    theme
  }
}
`;

export const addCategoryMutation = `
mutation AddCategory($name: String!){
  addCategory(name:$name)
}
`;
export const getUserCategoriesQuery = `
{
  getUserCategories{
    categories{
      name
      id
    }
  }
}
`;

export const updateCategoryMutation = `
mutation UpdateCategory($categoryId:Int!, $name: String!){
  updateCategory(categoryId:$categoryId, name:$name)
}
`;

export const deleteCategoryMutation = `
mutation DeleteCategory($categoryId: Int!){
  deleteCategory(categoryId:$categoryId)
}`;

export const addSubCategoryMutation = `
mutation AddSubCategory($name: String!, $categoryId: Int!){
    addSubCategory(name:$name, categoryId:$categoryId)
}
`;

export const deleteSubCategoryMutation = `
mutation DeleteSubCategory($name: String!, $categoryId: Int!){
    deleteSubCategory(name:$name, categoryId:$categoryId)
}
`;
