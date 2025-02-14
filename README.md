# E-commerce CMS

Welcome to the E-commerce CMS project! This project is built using FireCMS and Firebase to manage e-commerce collections such as products and users.

## Getting Started

### Prerequisites

- Node.js
- Yarn package manager
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/ecommerce-cms.git
cd ecommerce-cms
```

2. Install dependencies:

```bash
yarn install
```

3. Create a Firebase project and web app. Copy the configuration to `src/firebase_config.ts`.

4. Create a `.env` file based on the `.env.template` and fill in the required environment variables.

### Running the Project

To start the development server, run:

```bash
yarn dev
```

### Building the Project

To build the project for production, run:

```bash
yarn build
```

### Deploying the Project

To deploy the project to Firebase Hosting, run:

```bash
yarn deploy
```

## Project Structure

- `src/`: Contains the source code of the project.
  - `collections/`: Contains the collection definitions for FireCMS.
  - `hooks/`: Contains custom hooks.
  - `App.tsx`: Main application component.
  - `firebase_config.ts`: Firebase configuration file.
  - `fetchFirestoreCollections.ts`: Function to fetch Firestore collections dynamically.
- `public/`: Contains static assets and the `index.html` file.
- `package.json`: Project configuration and dependencies.
- `tailwind.config.js`: Tailwind CSS configuration.
- `tsconfig.json`: TypeScript configuration.
- `vite.config.ts`: Vite configuration.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [FireCMS](https://firecms.co/)
- [Firebase](https://firebase.google.com/)
- [Cloudinary](https://cloudinary.com/)

## Contributors

- Kalkidan Getachew <kalgetachew375@gmail.com>
- Firaol Tufa <olfira45@gmail.com>
- Bereket Abdela <bekibekina@gmail.com>

Feel free to contribute to this project by submitting issues or pull requests.
