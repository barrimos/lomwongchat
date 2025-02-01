# LOMWONG CHAT (ล้อมวงคุย)
- [LOMWONG CHAT (ล้อมวงคุย)](#lomwong-chat-ล้อมวงคุย)
  - [Describe](#describe)
  - [Concept](#concept)
  - [Versions 1.0.0a](#versions-100a)
  - [Stacks](#stacks)
  - [Libraries](#libraries)
  - [Mechanism](#mechanism)
  - [Testing chat](#testing-chat)
  - [Features](#features)
  - [TTL](#ttl)
  - [Endpoint](#endpoint)
  - [Problem and Resolve](#problem-and-resolve)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

## Describe
is a real-time chatting web application designed to facilitate seamless communication between users. It supports both one-to-one and one-to-many chat rooms, allowing users to create global rooms, search for rooms and usernames, and interact with various chat features.

## Concept
__Gather 'round, folks! I've got a story to tell__
`Lomwong Chat` in Thai, which translates to `Campfire Chat` in English, evokes a warm and cozy atmosphere where people `gather around` a campfire to share stories, ideas, and experiences and mysteries stories.

## Versions 1.0.0a
**Note:** This web application is a `programming practice project.`
The code may not follow best practices,
but efforts will be made to improve and refine it over time.</br>
**Duration development** 7 ~ 8 months (or more than that + 1) 😭
  - Start May 2024

## Stacks
- **MongoDB**: A NoSQL database for storing user data and chat messages.
- **Express**: A web application framework for Node.js, used to build the backend API.
- **React (TypeScript)**: A JavaScript library for building user interfaces, used for the frontend.
- **Node.js**: A JavaScript runtime for building the server-side application.

## Libraries
  - **Socket.io**: A library for real-time web applications, enabling real-time, bidirectional communication between web clients and servers.
  - **Redis (includes Stack)**: A powerful in-memory data structure store, used for caching and real-time data processing.
  - **Express-session**: Middleware allows the creation and storage of the session data used for authentication or user preferences
  - **Styling**: Bootstrap framework.

## Mechanism
  - **Nonce**: 15 mins A unique number or value that is used only once in a cryptographic communication to prevent replay attacks.
  - **Locked**: 1 sec Prevent users too much request or refresh page
  - **Last verify**: 15 mins The timestamp or record of the last verification or authentication check.
  - **Heartbeat**: 30 mins extend session when sent to tells the system or mechanism that is still active and functioning.
  - **Cronjob**: 10 mins after `global:locked` and 5 mintues after `global:unlock` automatic save chat logs to ensure no chat logs are lost and all saved.

## Testing chat
To test the chat functionality, you can either register a new username or use one of the following test usernames:
  - **rvv**
  - **red** (Banned user test)
  - **aes**
  - **dexter**
  - **dosan**
  - **zata**
  - **admin** (Only allow access to the `/adsysop` page and vice versa to other users)
  - Password for all test: `123`

## Features
version _1.0.0a_
- **Responsive design**: This website supports responsive design, ensuring a seamless experience across various devices and screen
- **Token-based authentication**: Ensure secure your account.
- **Session-based authentication**: A method of identifying logged in users.
- **Captcha login verification**
  - **Read out loud**: A friendly website tool for everyone
  - **Renew captcha**: A friendly website tool for everyone
- **Multi-Device Login**: Allows log in on up to `three devices simultaneously`, ensuring seamless access and synchronization across all their devices.
- **Global room one to many**: Create and join chat rooms where multiple users can communicate simultaneously.
- **Private room one to one**: Engage in private conversations with individual users.
- **Create new global room**: Users can create new global chat rooms that are accessible to all users.
- **Searching**
  - **Room**: for existing chat rooms by name.
  - **User**: Search for users by their username to start a private conversations.
- **Online users list**: Showing users who online.
- **Announcement join leave at global room**: Popup display who join or leave each room
- **Bubble's context menu**
  - `Hold press at bubble chat for 1s to open context menu`
  - **Report**: Report inappropriate messages within the chat.
  - **Copy**: Copy individual chat messages to the clipboard.
  - **Reply**: Reply to specific messages within the chat for better context and clarity.
- **Private message reminder**: Reminder that you have a new private message waiting for you when you back to online. `24 Hours`
- **Status system**
  - **Normal**: Full access to all features.
  - **Banned**: Access to main chat room not allowed until your disputes have been resolved. `dispute resolution page`
- **Disputation page**: Page for users who have been banned, to debate with admin One to One.
  - **Commenting**: Expressing opinions or attitudes to deal with criticism.
    - Why is commenting not real-time chatting, because Explaining and resolving allegations takes time.
  - **Image** Enhance your comments with images.
- **Admin dashboard**
  - **Tracking**: To keep track of where user joining each device in real-time
  - **Control**: To manage user permissions status
  - **Chatting**: A communication tool that allows administrators to interact with users for quick resolution of issues and enhances collaboration.
  - **Manipulate session**: Manipulate session's ID involves managing unique identifiers, such as deleting session logins, within a system.

## TTL
  - **Access token** 15 mins, stays in cookie 1 day
  - **Refresh token** 7 days
  - **Rate limit** 3 times, limit time 15 mins
  - **Session id** 1 day, after login reduce to 30 mins
  - **UUID** 1 day
  - **Heartbeat** 15 mins, extends session lifespan (client-cookie, server-cache and database) 30 mins relate to jwt token renewal
    - `reason why 30 mins`
      - Token Expiry: Tokens remain in cookies for 1 day after expiration.
      - Session Validity: Sessions remain valid for 15 mins post-token-expiry, allowing users to re-sign tokens (excetps 15 mins first half).
      - Forced Logout: If a session expires (inactive for over 15 mins), users are logged out immediately.

## Endpoint
  - **/general**
    - generate and validate captcha for Lomwong login page
    - get remaining attempts for Adsysop login page (for Lomwong login page use rate limit only)
  - **/user**
    - registration
    - login
    - verify token
    - update status for admin role only
    - logout
  - **/data**
    - fetch and create channels
    - fetch and create ticket (bubble's chat report)
    - update ticket status for admin role only
    - delete dispute issue for admin role only
    - delete session id (force logout) for admin role only
  - **/disputeResolution**
    - open and close Dispute issue page (banned user only)
    - fetch and create comments
  
## Problem and Resolve
  - **Message manage**
    - **problem** is message is being sent to wrong display.
      - e.g. while in the lobby then open the private room. Now you send a message in the private room, but this message is broadcasted to both the lobby and the private room.
    - **bugs** is I stubborn to managing whole messages data in app with only one state.
    - **resolve** It took me a long time. I'm start coding a new small app from scratch using the trial and error knowledge from the main app. Until the real problem and solution are found
  - **Caching**
  - **Security**
  - **State Hook**

## Contributing
We welcome contributions to LOMWONGCHAT! If you'd like to contribute, please follow these steps:
1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
If you have any questions or need further assistance, feel free to reach out to us

Happy chatting!
