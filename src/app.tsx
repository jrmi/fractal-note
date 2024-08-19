import './app.css';
import Tree from './Tree';
import data from './assets/mind_map_complete.json';
import { styled } from 'goober';

const StyledMain = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 30%;
  min-height: 100vh;
`;

export function App() {
  return (
    <StyledMain>
      <Tree nodes={data} />
    </StyledMain>
  );
}
