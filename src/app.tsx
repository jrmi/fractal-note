import useLocalStorage from './useLocalstorage';
import { styled } from 'goober';
import { Link, Route, Switch } from 'wouter';
import { useCallback, useEffect, useState } from 'preact/hooks';

import './app.css';
import Tree from './Tree';
import example from './assets/mind_map.json';
import fullExample from './assets/mind_map_complete.json';

const Topbar = styled('div')`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  background-color: #ccc;
  height: 40px;
`;

const StyledMain = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 30%;
  min-height: 100vh;
  padding-top: 40px;
`;

function WithStorage({ name }) {
  const [names, setNames] = useLocalStorage('_names', []);

  const currentNotes = names?.find(({ name: noteName }) => noteName === name);

  useEffect(() => {
    if (!currentNotes) {
      setNames((prevNotes) => [...prevNotes, { name }]);
    }
  }, [currentNotes, name]);

  const [value, set] = useLocalStorage(name, example);

  return (
    <StyledMain>
      <Tree nodes={value} onChange={set} />
    </StyledMain>
  );
}

function Menu() {
  const [names] = useLocalStorage('_names', []);
  return (
    <Topbar>
      {names?.map(({ name }) => <Link href={`/note/${name}`}>{name}</Link>)}
    </Topbar>
  );
}

export function App() {
  return (
    <>
      <Menu />
      <Switch>
        <Route path='/note/:name'>
          {(params) => <WithStorage name={params.name} />}
        </Route>

        {/* Default route in a switch */}
        <Route>404: No such page!</Route>
      </Switch>
    </>
  );
}
