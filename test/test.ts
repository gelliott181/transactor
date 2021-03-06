import { ValueStore } from '../ValueStore';
import { ArrayStore } from '../ArrayStore';

type ShouldFn = (Promise<void> | void)
let successes = 0;
let total = 0;

const isAsync = (obj: any) => obj?.constructor.name === "AsyncFunction";
const xtest = (msg: any, should: any) => { };
const test = async (msg: string, should: () => ShouldFn = async () => {}, { timeout = 500 } = { }) => {
  total++;

  try {
    let timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('Test timed out'), timeout));

    await Promise.race([ should(), timeoutPromise ]);
    successes += 1;
    console.log(`${successes}/${total} ✅ ${msg}`);
  } catch (e) {
    console.error(`💔 ${msg}`);
    console.error(`\t ${e}`);
  }
}

test('ValueStore ', async () => {
  return new Promise((resolve, reject) => {
    const store: ValueStore = new ValueStore();

    let emissions = 0;
    store.updates().subscribe({
      next: (v: any) => {
        if (emissions === 0 && v !== undefined) reject('Initial value was not undefined!');
        if (emissions === 1 && v !== 3) reject(`Wrong value for emission. ( emissions: ${emissions}, value: ${JSON.stringify(v)} )`);

        if (emissions === 2) {
          const { x, y } = v;
          if (x !== 1 || y !== 2) reject('Wrong value in object.');
        }

        if (emissions === 3) {
          const { x, y, z } = v;
          if (x !== 1 || y !== 2 || z !== 3) reject(`Wrong value in object. ${Object.entries(v)}`);
        }

        emissions++;
        if (emissions === 4) resolve();
      },
    });

    store.transaction(({ set }) => {
      set(1);
      set(2);
      set(3);
    });

    const x = 1;
    const y = 2;
    store.transaction(({ set }) => {
      set({ x, y });
    });

    const z = 3;
    store.transaction(({ set }) => {
      set({ z });
      set({ x, y, z });
    });

  });
});

test('ArrayStore ', async () => {
  return new Promise((resolve, reject) => {
    const store: ArrayStore<any[]> = new ArrayStore<any[]>({
      initialized: (v) => console.log('initialized', v),
      finalized: (v) => console.log('finalized', v)
    });

    let emissions = 0;
    store.updates().subscribe({
      next: (v: any[]) => {
        if (emissions === 0) {
          if (!Array.isArray(v) || v.length > 0) reject('Initial value was not undefined!')
        }

        if (emissions === 1) {
          if (!Array.isArray(v) || v.length != 1 || v[0] !== 1) reject(`Wrong value for emission. ( emissions: ${emissions}, value: ${JSON.stringify(v)} )`);
        }

        if (emissions === 2) {
          if (!Array.isArray(v) || v.length != 2 || (v[0] !== 1 && v[1] !== 2)) reject(`Wrong value for emission. ( emissions: ${emissions}, value: ${JSON.stringify(v)} )`);
        }

        emissions++;
        if (emissions === 3) resolve();
      },
    });

    store.transaction(() => [ 1 ]);
    store.transaction((array: any[]) => [ ...array, 2 ]);
  });
});