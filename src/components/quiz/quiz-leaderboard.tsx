import { motion } from 'motion/react';
import type { LeaderboardEntry } from '@/types/quiz';

interface QuizLeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

export default function QuizLeaderboard({
  leaderboard,
}: QuizLeaderboardProps) {
  return (
    <div className="pt-4 relative w-full lg:mt-8 text-base lg:text-lg text-white">
      <div className="flex items-center justify-between relative">
        <hr className="w-[20%] lg:w-[30%] border-1 border-white" />
        <h3 className="w-[40%] absolute -top-4 left-1/2 -translate-x-1/2 text-center font-bold text-lg lg:text-xl">
          Leaderboard
        </h3>
        <hr className="w-[20%] lg:w-[30%] border-1 border-white" />
      </div>
      <div className="mt-6">
        {leaderboard.map((user) => (
          <LeaderboardName key={user.rank} user={user} />
        ))}
      </div>
    </div>
  );
}

interface LeaderboardNameProps {
  user: LeaderboardEntry;
}

function LeaderboardName({ user }: LeaderboardNameProps) {
  return (
    <div className="w-[80%] lg:w-[70%] mx-auto font-medium">
      {user.isCurrentUser ? (
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex items-start lg:items-center justify-between"
        >
          <div className="flex items-start lg:items-center gap-x-3 w-[60%] lg:w-auto">
            <h3>{user.rank}</h3>
            <h3>{user.name}</h3>
          </div>
          <h3>{user.points} pts</h3>
        </motion.div>
      ) : (
        <div className="flex items-start lg:items-center justify-between">
          <div className="flex items-start lg:items-center gap-x-3 w-[60%] lg:w-auto">
            <h3>{user.rank}</h3>
            <h3>{user.name}</h3>
          </div>
          <h3>{user.points} pts</h3>
        </div>
      )}
    </div>
  );
}
