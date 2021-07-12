/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateMessage = /* GraphQL */ `
  subscription OnCreateMessage($channelId: ID) {
    onCreateMessage(channelId: $channelId) {
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
export const onCreateChannel = /* GraphQL */ `
  subscription OnCreateChannel {
    onCreateChannel {
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
export const onUpdateChannel = /* GraphQL */ `
  subscription OnUpdateChannel {
    onUpdateChannel {
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
export const onDeleteChannel = /* GraphQL */ `
  subscription OnDeleteChannel {
    onDeleteChannel {
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
