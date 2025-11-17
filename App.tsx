
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, ToppingType, Order, Topping, HighScore } from './types';
import { LEVEL_CONFIG, POINTS_PER_PIZZA, INITIAL_HIGH_SCORES } from './constants';
import { KetchupIcon, CheeseIcon, OliveIcon } from './components/Icons';

// --- HELPER FUNCTIONS ---
const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- CHILD COMPONENTS (Defined outside App to prevent re-creation on re-render) ---

interface PizzaProps {
    toppings: Topping[];
    isSending: boolean;
}
const Pizza: React.FC<PizzaProps> = ({ toppings, isSending }) => (
    <div className={`relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-500 ease-in-out ${isSending ? 'translate-x-full rotate-45 scale-50 opacity-0' : 'translate-x-0 rotate-0'}`}>
        {/* Dough */}
        <div className="absolute inset-0 bg-yellow-400 rounded-full shadow-lg"></div>
        {/* Crust */}
        <div className="absolute inset-2 bg-yellow-500 rounded-full border-8 border-yellow-600"></div>
        {/* Toppings */}
        {toppings.map(topping => (
            <div
                key={topping.id}
                className="absolute w-6 h-6 md:w-8 md:h-8 transition-all duration-200 animate-pop"
                style={{ top: `${topping.y}%`, left: `${topping.x}%`, transform: `translate(-50%, -50%) rotate(${topping.rotation}deg)` }}
            >
                {topping.type === 'ketchup' && <KetchupIcon />}
                {topping.type === 'cheese' && <CheeseIcon />}
                {topping.type === 'olives' && <OliveIcon />}
            </div>
        ))}
    </div>
);

interface OrderTicketProps {
    order: Order | null;
    pizzasCompleted: number;
    pizzasTotal: number;
}
const OrderTicket: React.FC<OrderTicketProps> = ({ order, pizzasCompleted, pizzasTotal }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border-t-8 border-red-500 w-full max-w-sm">
        <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700 border-b pb-2 mb-2">PIZZA ORDER</h2>
        <p className="text-center font-semibold text-gray-600 mb-4">Pizza {pizzasCompleted + 1} of {pizzasTotal}</p>
        {order ? (
            <ul className="space-y-2 text-lg">
                <li className="flex justify-between items-center"><span>Ketchup Sauce:</span> <span className="font-bold bg-red-100 text-red-700 px-2 rounded">{order.ketchup}</span></li>
                <li className="flex justify-between items-center"><span>Cheese Slices:</span> <span className="font-bold bg-yellow-100 text-yellow-700 px-2 rounded">{order.cheese}</span></li>
                <li className="flex justify-between items-center"><span>Olives:</span> <span className="font-bold bg-gray-200 text-gray-800 px-2 rounded">{order.olives}</span></li>
            </ul>
        ) : <p className="text-center text-gray-500">No order yet...</p>}
    </div>
);

interface ToppingControlsProps {
  onAddTopping: (topping: ToppingType) => void;
  currentPizzaToppings: Order;
  order: Order | null;
  disabled: boolean;
}
const ToppingControls: React.FC<ToppingControlsProps> = ({ onAddTopping, currentPizzaToppings, order, disabled }) => {
    const toppings: ToppingType[] = ['ketchup', 'cheese', 'olives'];
    
    const isToppingComplete = (type: ToppingType) => {
        return order ? currentPizzaToppings[type] >= order[type] : false;
    };

    return (
        <div className="flex justify-center space-x-4 p-4 bg-gray-800 rounded-xl shadow-inner w-full max-w-sm">
            {toppings.map(topping => (
                <button
                    key={topping}
                    onClick={() => onAddTopping(topping)}
                    disabled={disabled || isToppingComplete(topping)}
                    className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center font-bold text-white transition-all duration-200
                        shadow-lg border-4
                        ${topping === 'ketchup' ? 'bg-red-500 border-red-700 hover:bg-red-600' : ''}
                        ${topping === 'cheese' ? 'bg-yellow-400 border-yellow-600 hover:bg-yellow-500' : ''}
                        ${topping === 'olives' ? 'bg-gray-600 border-gray-800 hover:bg-gray-700' : ''}
                        disabled:bg-gray-400 disabled:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50
                        focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-800
                        ${topping === 'ketchup' ? 'focus:ring-red-400' : ''}
                        ${topping === 'cheese' ? 'focus:ring-yellow-300' : ''}
                        ${topping === 'olives' ? 'focus:ring-gray-500' : ''}
                    `}
                >
                    <div className="w-10 h-10 mb-1">{topping === 'ketchup' ? <KetchupIcon/> : topping === 'cheese' ? <CheeseIcon/> : <OliveIcon/>}</div>
                    <span className="capitalize text-sm">{topping}</span>
                    <span className="text-xs">({order ? `${currentPizzaToppings[topping]}/${order[topping]}` : '0/0'})</span>
                </button>
            ))}
        </div>
    );
};

interface HighScoreTableProps {
    scores: HighScore[];
}
const HighScoreTable: React.FC<HighScoreTableProps> = ({ scores }) => (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg mt-8">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">High Scores</h3>
        <table className="w-full text-left">
            <thead>
                <tr className="border-b-2 border-gray-300">
                    <th className="p-2">Rank</th>
                    <th className="p-2">Name</th>
                    <th className="p-2 text-right">Score</th>
                </tr>
            </thead>
            <tbody>
                {scores.sort((a, b) => b.score - a.score).slice(0, 5).map((score, index) => (
                    <tr key={score.id} className="border-b border-gray-200 last:border-b-0">
                        <td className="p-2 font-bold">#{index + 1}</td>
                        <td className="p-2">{score.name}</td>
                        <td className="p-2 text-right font-mono">{score.score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
    const [gameState, setGameState] = useState<GameState>(GameState.NotStarted);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(LEVEL_CONFIG[0].time);
    const [highScores, setHighScores] = useState<HighScore[]>(INITIAL_HIGH_SCORES);
    
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [currentPizzaToppings, setCurrentPizzaToppings] = useState<Topping[]>([]);
    const [pizzasCompletedThisLevel, setPizzasCompletedThisLevel] = useState(0);

    const [isSendingPizza, setIsSendingPizza] = useState(false);
    const [bonusPoints, setBonusPoints] = useState(0);
    // FIX: Changed NodeJS.Timeout to number as setInterval in browsers returns a number.
    const timerRef = useRef<number | null>(null);

    const generateNewOrder = useCallback((currentLevel: number) => {
        const config = LEVEL_CONFIG[currentLevel - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length-1];
        const newOrder: Order = {
            ketchup: getRandomInt(1, config.toppingMax),
            cheese: getRandomInt(1, config.toppingMax),
            olives: getRandomInt(1, config.toppingMax),
        };
        setCurrentOrder(newOrder);
        setCurrentPizzaToppings([]);
    }, []);

    const setupLevel = useCallback((levelToSetup: number) => {
        const config = LEVEL_CONFIG[levelToSetup - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
        setTimer(config.time);
        setPizzasCompletedThisLevel(0);
        generateNewOrder(levelToSetup);
    }, [generateNewOrder]);

    const startGame = useCallback(() => {
        setLevel(1);
        setScore(0);
        setGameState(GameState.InProgress);
        setupLevel(1);
    }, [setupLevel]);
    
    useEffect(() => {
        if (gameState === GameState.InProgress) {
            timerRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setGameState(GameState.GameOver);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    const handleAddTopping = (toppingType: ToppingType) => {
        if (!currentOrder) return;

        const currentCounts = currentPizzaToppings.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
        }, {} as Record<ToppingType, number>);

        if (currentCounts[toppingType] >= currentOrder[toppingType]) {
            return;
        }

        const newTopping: Topping = {
            id: `${Date.now()}-${Math.random()}`,
            type: toppingType,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            rotation: Math.random() * 360,
        };
        setCurrentPizzaToppings(prev => [...prev, newTopping]);
    };

    useEffect(() => {
        if (!currentOrder || gameState !== GameState.InProgress) return;
        
        const currentCounts = currentPizzaToppings.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
        }, { ketchup: 0, cheese: 0, olives: 0 });

        const isComplete =
            currentCounts.ketchup === currentOrder.ketchup &&
            currentCounts.cheese === currentOrder.cheese &&
            currentCounts.olives === currentOrder.olives;

        if (isComplete) {
            setIsSendingPizza(true);
            setScore(s => s + POINTS_PER_PIZZA);
            
            setTimeout(() => {
                const nextPizzaCount = pizzasCompletedThisLevel + 1;
                const config = LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
                
                if (nextPizzaCount >= config.pizzas) {
                    const bonus = getRandomInt(config.bonusRange[0], config.bonusRange[1]);
                    setBonusPoints(bonus);
                    setScore(s => s + bonus);
                    setGameState(GameState.LevelComplete);
                } else {
                    setPizzasCompletedThisLevel(nextPizzaCount);
                    generateNewOrder(level);
                }
                setIsSendingPizza(false);
            }, 600); // Animation duration
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPizzaToppings, currentOrder, gameState, level, pizzasCompletedThisLevel]);

    const handleNextLevel = () => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setGameState(GameState.InProgress);
        setupLevel(nextLevel);
    };

    useEffect(() => {
        if (gameState === GameState.GameOver) {
            const isHighScore = score > 0 && (highScores.length < 5 || score > Math.min(...highScores.map(s => s.score)));
            if (isHighScore) {
                const newHighScores = [...highScores, { id: Date.now(), name: 'Pizza Pro', score }]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);
                setHighScores(newHighScores);
            }
        }
    }, [gameState, score, highScores]);

    const currentToppingCounts = currentPizzaToppings.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
    }, { ketchup: 0, cheese: 0, olives: 0 });
    
    const config = LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];

    const renderGameState = () => {
        switch (gameState) {
            case GameState.NotStarted:
                return (
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-red-700 drop-shadow-lg mb-4">Pizza Maker Math Challenge</h1>
                        <p className="text-lg md:text-xl text-gray-700 mb-8">Ready to test your speed and accuracy?</p>
                        <button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-2xl shadow-lg transition-transform transform hover:scale-105">
                            Start Game!
                        </button>
                    </div>
                );
            case GameState.LevelComplete:
                return (
                    <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg animate-pop">
                        <h2 className="text-4xl font-bold text-green-600 mb-2">Level {level} Complete!</h2>
                        <p className="text-2xl text-yellow-600 font-semibold mb-4">Bonus: +{bonusPoints} points!</p>
                        <p className="text-xl text-gray-700 mb-6">Total Score: {score}</p>
                        <button onClick={handleNextLevel} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-md transition-transform transform hover:scale-105">
                            Next Level
                        </button>
                    </div>
                );
            case GameState.GameOver:
                 return (
                    <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg animate-pop">
                        <h2 className="text-5xl font-bold text-red-600 mb-4">Game Over!</h2>
                        <p className="text-2xl text-gray-700 mb-6">Final Score: {score}</p>
                        <button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-md transition-transform transform hover:scale-105">
                            Play Again
                        </button>
                    </div>
                );
            case GameState.InProgress:
                return (
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
                        <div className="flex-shrink-0 w-80 h-80 flex items-center justify-center">
                             <Pizza toppings={currentPizzaToppings} isSending={isSendingPizza} />
                        </div>
                        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                            <OrderTicket order={currentOrder} pizzasCompleted={pizzasCompletedThisLevel} pizzasTotal={config.pizzas} />
                            <ToppingControls onAddTopping={handleAddTopping} currentPizzaToppings={currentToppingCounts} order={currentOrder} disabled={isSendingPizza}/>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-between p-4 bg-cover bg-center" style={{backgroundImage: "url('https://picsum.photos/seed/pizzabg/1920/1080')"}}>
             <header className="w-full max-w-5xl">
                {gameState === GameState.InProgress && (
                    <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md">
                        <div className="text-xl md:text-2xl font-bold">Level: <span className="text-blue-600">{level}</span></div>
                        <div className="text-xl md:text-2xl font-bold">Score: <span className="text-green-600">{score}</span></div>
                        <div className="text-xl md:text-2xl font-bold">Time: <span className={`px-2 py-1 rounded ${timer <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>{timer}s</span></div>
                    </div>
                )}
            </header>

            <main className="flex-grow flex items-center justify-center w-full py-8">
                {renderGameState()}
            </main>

            <footer className="w-full text-center text-gray-800 flex flex-col items-center">
                {gameState !== GameState.InProgress && <HighScoreTable scores={highScores} />}
                <div className="mt-8 text-sm text-white/90 bg-black/50 px-4 py-2 rounded-full">
                    <span>(C) Noam Gold AI 2025 | </span>
                    <a href="mailto:gold.noam@gmail.com" className="underline hover:text-amber-300">Send Feedback</a>
                </div>
            </footer>
        </div>
    );
}
