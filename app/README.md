# Pixy Isometric Template

A modern base template for isometric games using **Pixi.js**, **TypeScript**, **Valtio**, and **Vite**.

## 🚀 Features

- **Pixi.js 8.x** - High-performance 2D WebGL renderer
- **TypeScript** - Type-safe development
- **Valtio** - Reactive state management
- **Vite** - Lightning-fast build tool and dev server
- **ESLint** - Code linting and formatting
- **Modern ES modules** - Latest JavaScript features

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
app/
├── src/
│   ├── game/
│   │   └── Game.ts          # Main game class
│   ├── store/
│   │   └── gameStore.ts     # Valtio state management
│   └── main.ts              # Application entry point
├── index.html               # HTML template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md              # This file
```

## 🎮 Game Development

### Adding New Scenes

The game uses a container-based scene system. Add new scenes by:

1. Creating scene classes that extend or use Pixi containers
2. Managing scene transitions through the game store
3. Using the `gameStore` for global state management

### State Management

The app uses Valtio for reactive state management:

```typescript
import { gameStore, updateGameStore } from './store/gameStore'

// Update state
updateGameStore.setCurrentScene('gameplay')

// Access state
console.log(gameStore.currentScene)
```

### Pixi.js Integration

The `Game` class initializes Pixi.js and provides:
- Automatic canvas setup and DOM integration
- Responsive resize handling
- Scene management through containers
- Modern Pixi.js v8 API usage

## 🔧 Configuration

- **Vite config**: [`vite.config.ts`](vite.config.ts)
- **TypeScript config**: [`tsconfig.json`](tsconfig.json)
- **Path aliases**: `@/` maps to `src/`

## 📖 Resources

- [Pixi.js Documentation](https://pixijs.download/dev/docs/index.html)
- [Valtio Documentation](https://valtio.pmnd.rs/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this template for your projects!