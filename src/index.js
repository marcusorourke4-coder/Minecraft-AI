import 'dotenv/config';
import mineflayer from 'mineflayer';
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';

const host = process.env.MC_HOST;
const port = Number(process.env.MC_PORT || 25565);
const username = process.env.BOT_USERNAME || 'MindcraftBot';
const auth = process.env.MC_AUTH || 'offline';

if (!host || host === 'your-java-server-hostname') {
  console.error('Set MC_HOST in your environment before running the bot.');
  process.exit(1);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('MC_PORT must be a valid TCP port.');
  process.exit(1);
}
if (!['offline', 'microsoft'].includes(auth)) {
  console.error('MC_AUTH must be offline or microsoft.');
  process.exit(1);
}

const bot = mineflayer.createBot({ host, port, username, auth, hideErrors: false });
bot.loadPlugin(pathfinder);

let movements;
let decisionTimer;
let goalName = 'Starting';
let lastAction = 0;
const { GoalNear, GoalFollow } = goals;

const safeChat = (message) => {
  if (bot.player) bot.chat(String(message).slice(0, 160));
};

function nearestPlayer() {
  return Object.values(bot.players)
    .filter(p => p.username !== bot.username && p.entity)
    .sort((a,b) => bot.entity.position.distanceTo(a.entity.position) - bot.entity.position.distanceTo(b.entity.position))[0];
}

function selectGoal() {
  if (!bot.entity || !movements || Date.now() - lastAction < 5500) return;
  lastAction = Date.now();
  const health = bot.health ?? 20;
  // Prioritize safety over exploration.
  if (health <= 8) {
    bot.pathfinder.setGoal(null);
    goalName = 'Low health: staying put';
    console.log('[AI]', goalName);
    return;
  }

  const player = nearestPlayer();
  if (process.env.FOLLOW_PLAYERS === 'true' && player?.entity) {
    bot.pathfinder.setGoal(new GoalFollow(player.entity, 3), true);
    goalName = 'Following ' + player.username;
    console.log('[AI]', goalName);
    return;
  }

  // Starter autonomy: walk to a nearby safe position, then choose a new target.
  const pos = bot.entity.position;
  const targets = [];
  for (let i = 0; i < 12; i++) {
    const dx = Math.floor((Math.random() - 0.5) * 24);
    const dz = Math.floor((Math.random() - 0.5) * 24);
    const point = pos.offset(dx, 0, dz);
    const support = bot.blockAt(point.offset(0, -1, 0));
    const feet = bot.blockAt(point);
    const head = bot.blockAt(point.offset(0, 1, 0));
    if (support?.boundingBox === 'block' && feet?.boundingBox === 'empty' && head?.boundingBox === 'empty') {
      targets.push(point);
    }
  }

  if (!targets.length) {
    goalName = 'Observing surroundings';
    console.log('[AI]', goalName);
    return;
  }

  const dest = targets[0];
  goalName = 'Exploring nearby terrain';
  bot.pathfinder.setGoal(new GoalNear(dest.x, dest.y, dest.z, 2));
  console.log('[AI]', goalName, dest.toString());
}

bot.once('spawn', () => {
  console.log('[Connected]', bot.username, 'at', host + ':' + port);
  movements = new Movements(bot);
  movements.canDig = false;
  movements.allow1by1towers = false;
  bot.pathfinder.setMovements(movements);
  safeChat('MindcraftBot online! Autonomous exploration prototype active.');
  decisionTimer = setInterval(selectGoal, 12000);
  selectGoal();
});

bot.on('chat', (player, message) => {
  if (player === bot.username) return;
  if (message.toLowerCase() === '!bot status') safeChat('Goal: ' + goalName + ' | Health: ' + bot.health);
  if (message.toLowerCase() === '!bot stop') {
    clearInterval(decisionTimer);
    bot.pathfinder.setGoal(null);
    goalName = 'Stopped by player';
    safeChat('Stopped. Restart the bot service to resume.');
  }
});

bot.on('kicked', reason => console.error('[Kicked]', reason));
bot.on('error', error => console.error('[Error]', error.message));
bot.on('end', reason => {
  clearInterval(decisionTimer);
  console.log('[Disconnected]', reason);
});
process.on('SIGTERM', () => { clearInterval(decisionTimer); bot.quit(); });
process.on('SIGINT', () => { clearInterval(decisionTimer); bot.quit(); });
