import { h, render } from 'preact';
import { setup } from 'goober';
import { App } from './app.tsx';
import './index.css';

// Set up Goober with Preact's h function
setup(h);

render(<App />, document.getElementById('app')!);
