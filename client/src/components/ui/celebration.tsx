import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { ChevronRight, XCircle } from "lucide-react";

interface ConfettiProps {
  count: number;
}

const Confetti: React.FC<ConfettiProps> = ({ count }) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: string; delay: string; duration: string; }>>([]);
  
  useEffect(() => {
    const colors = ["#ff4081", "#3f51b5", "#4caf50", "#ffc107"];
    const newConfetti = [];
    
    for (let i = 0; i < count; i++) {
      newConfetti.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.5}s`,
        duration: `${3 + Math.random() * 2}s`,
      });
    }
    
    setConfetti(newConfetti);
  }, [count]);
  
  return (
    <div className="confetti-container absolute inset-0 pointer-events-none">
      {confetti.map((item) => (
        <motion.div
          key={item.id}
          className="absolute w-3 h-3 opacity-80"
          style={{
            left: item.left,
            top: "-20px",
            backgroundColor: ["#ff4081", "#3f51b5", "#4caf50", "#ffc107"][item.id % 4],
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: "100vh",
            rotate: 720,
            opacity: 0,
          }}
          transition={{
            duration: parseFloat(item.duration),
            delay: parseFloat(item.delay),
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default function CelebrationOverlay() {
  const { showCelebration, setShowCelebration, formattedTime, createNewGame, difficulty } = useGame();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleNewGame = async () => {
    setShowCelebration(false);
    await createNewGame(difficulty);
  };

  const handleClose = () => {
    setShowCelebration(false);
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (overlayRef.current === e.target) {
      setShowCelebration(false);
    }
  };

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClickOutside}
        >
          <Confetti count={50} />
          
          <motion.div
            className="bg-background rounded-lg shadow-2xl p-8 text-center max-w-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <h2 className="text-3xl font-bold text-primary mb-4">おめでとう！</h2>
            <p className="text-lg mb-4">パズルを完成させました！</p>
            <div className="text-2xl font-mono font-bold mb-6">{formattedTime}</div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleNewGame}
                className="flex items-center justify-center"
              >
                新しいゲーム
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex items-center justify-center"
              >
                閉じる
                <XCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
