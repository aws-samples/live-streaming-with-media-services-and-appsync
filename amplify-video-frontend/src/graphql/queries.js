/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getChannel = /* GraphQL */ `
  query GetChannel($id: ID!) {
    getChannel(id: $id) {
      id
      name
      url
      createdAt
      messages {
        items {
          id
          channelId
          username
          content
          createdAt
          updatedAt
        }
        nextToken
      }
      updatedAt
    }
  }
`;
export const listChannels = /* GraphQL */ `
  query ListChannels(
    $filter: ModelChannelFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChannels(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        url
        createdAt
        messages {
          nextToken
        }
        updatedAt
      }
      nextToken
    }
  }
`;
export const getMessage = /* GraphQL */ `
  query GetMessage($id: ID!) {
    getMessage(id: $id) {
      id
      channelId
      username
      content
      createdAt
      channel {
        id
        name
        url
        createdAt
        messages {
          nextToken
        }
        updatedAt
      }
      updatedAt
    }
  }
`;
export const listMessages = /* GraphQL */ `
  query ListMessages(
    $filter: ModelMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        channelId
        username
        content
        createdAt
        channel {
          id
          name
          url
          createdAt
          updatedAt
        }
        updatedAt
      }
      nextToken
    }
  }
`;
export const listMessagesByChannel = /* GraphQL */ `
  query ListMessagesByChannel(
    $channelId: ID
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMessagesByChannel(
      channelId: $channelId
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        channelId
        username
        content
        createdAt
        channel {
          id
          name
          url
          createdAt
          updatedAt
        }
        updatedAt
      }
      nextToken
    }
  }
`;
