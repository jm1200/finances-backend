// #########################  User Resolver ######################################
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
export const userMutation = `
query User($userId: String!){
    user(userId: $userId) {
      id
      email
      userSettingsId
      userSettings {
        theme
      }
      transactions{
        name
        amount
      }
    }
  }
  `;

export const usersQuery = `
  {
    users{
      id
      email
      userSettingsId
      userSettings{
        theme
      }
    }
  }
  `;
export const revokeRefreshTokensForUserMutation = `
mutation RevokeRefreshTokensForUser($userId: String!) {
    revokeRefreshTokensForUser(userId:$userId)
}
`;

export const logoutMutation = `
mutation Logout{
    logout
}`;

// #########################  UserSettings Resolver ######################################

export const updateThemeMutation = `
mutation updateTheme($id: String!, $theme:String!) {
  updateTheme(id: $id, theme: $theme) {
    theme
  }
}
`;

// #########################  Categories Resolver ######################################

export const addCategoryMutation = `
mutation AddCategory($name: String!){
  addCategory(name:$name)
}
`;
export const getUserCategoriesQuery = `
{
  getUserCategories{
      name
      id
  }
}
`;

export const updateCategoryMutation = `
mutation UpdateCategory($categoryId:String!, $name: String!){
  updateCategory(categoryId:$categoryId, name:$name)
}
`;

export const deleteCategoryMutation = `
mutation DeleteCategory($categoryId: String!){
  deleteCategory(categoryId:$categoryId)
}`;

export const addSubCategoryMutation = `
mutation AddSubCategory($name: String!, $categoryId: String!){
    addSubCategory(name:$name, categoryId:$categoryId)
}
`;

export const deleteSubCategoryMutation = `
mutation DeleteSubCategory($subCategoryId: String!){
    deleteSubCategory(subCategoryId:$subCategoryId)
}

`;

// #########################  Transactions Resolver ######################################

export const submitTransactionsMutation = `
mutation SubmitTransactions($transactions: [TransactionInput!]!) {
    submitTransactions(transactions:$transactions) {
      message
      inserted
    }
  }
`;

// #########################  SavedCaetgories Resolver ######################################
export const createSavedCategoryMutation = `
mutation CreateSavedCategory($name:String, $memo:String, $categoryId:String!, $subCategoryId:String!){
  createSavedCategory(data:{name:$name, memo:$memo, categoryId: $categoryId, subCategoryId:$subCategoryId})
}
`;
export const getUserSavedCategoriesMutation = `
query GetUserSavedCategories{
  getUserSavedCategories{
    id
    name
    memo
    keyName
    userId
    category{
      name
      id
    }
    subCategory{
      name
      id
    }
  }
}
`;
export const deleteSavedCategoryMutation = `
mutation DeleteSavedCategory($id:String!){
  deleteSavedCategory(id:$id)
}
`;
