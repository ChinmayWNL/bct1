'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { PixelSearch } from './PixelIcons';

const EMOJI_CATEGORIES = {
  pixel: {
    name: '👾 Pixel Arcade',
    icon: '👾',
    emojis: [
      { char: '👾', name: 'pixel alien space invader arcade 8-bit' },
      { char: '🪙', name: 'pixel coin gold token insert coin' },
      { char: '⭐', name: 'pixel star 1-up power up bonus' },
      { char: '❤️', name: 'pixel heart life health 8-bit' },
      { char: '🔥', name: 'pixel fire flame hot burn' },
      { char: '⚡', name: 'pixel zap lightning electricity flash' },
      { char: '💎', name: 'pixel diamond gem crystal eth web3' },
      { char: '🤖', name: 'pixel robot bot ai companion' },
      { char: '👻', name: 'pixel ghost pacman spooky boo' },
      { char: '💀', name: 'pixel skull game over ded skeleton' },
      { char: '🎮', name: 'pixel gamepad controller console arcade' },
      { char: '🏆', name: 'pixel trophy cup winner hi-score' },
      { char: '🛡️', name: 'pixel shield defense armor guard' },
      { char: '⚔️', name: 'pixel sword combat attack weapon' },
      { char: '🧪', name: 'pixel potion elixir flask magic mana' },
      { char: '🔑', name: 'pixel key unlock quest dungeon' },
      { char: '🔒', name: 'pixel lock security encrypted e2ee' },
      { char: '🚀', name: 'pixel rocket to the moon space launch' },
      { char: '🎲', name: 'pixel dice random rng luck roll' },
      { char: '☕', name: 'pixel coffee brew espresso cup' },
      { char: '😀', name: 'pixel smile happy classic retro face' },
      { char: '😁', name: 'pixel grin wide smile beaming' },
      { char: '😉', name: 'pixel wink flirty playful' },
      { char: '😎', name: 'pixel cool sunglasses shades boss swag' },
      { char: '👍', name: 'pixel thumbs up ok good yes like' }
    ]
  },
  smileys: {
    name: 'Smileys',
    icon: '😊',
    emojis: [
      { char: '😀', name: 'grinning face happy smile' },
      { char: '😃', name: 'smiling face with big eyes' },
      { char: '😄', name: 'grinning face with smiling eyes' },
      { char: '😁', name: 'beaming face with smiling eyes' },
      { char: '😆', name: 'grinning squinting face laugh haha' },
      { char: '😅', name: 'sweat smile nervous whew' },
      { char: '😂', name: 'tears of joy funny lol rofl haha' },
      { char: '🤣', name: 'rolling on floor laughing rofl lol' },
      { char: '🥲', name: 'smiling face with tear bittersweet' },
      { char: '🥹', name: 'face holding back tears touched pleading puppy' },
      { char: '😊', name: 'smiling face blush happy warm' },
      { char: '😇', name: 'smiling face with halo angel innocent blessed' },
      { char: '🙂', name: 'slightly smiling face positive' },
      { char: '🙃', name: 'upside down face silly sarcasm irony' },
      { char: '😉', name: 'winking face wink flirty' },
      { char: '😌', name: 'relieved face peaceful calm zen' },
      { char: '😍', name: 'smiling face with heart eyes love crush' },
      { char: '🥰', name: 'smiling face with hearts adore love sweet' },
      { char: '😘', name: 'face blowing a kiss kiss love blow' },
      { char: '😋', name: 'face savoring food delicious yum tasty' },
      { char: '😛', name: 'face with tongue playful silly blep' },
      { char: '😜', name: 'winking face with tongue crazy wild' },
      { char: '🤪', name: 'zany face wild crazy goofy wacky' },
      { char: '😎', name: 'smiling face with sunglasses cool boss swag' },
      { char: '🥳', name: 'partying face party celebrate birthday yay' },
      { char: '😏', name: 'smirking face smug sneaky sly' },
      { char: '😒', name: 'unamused face annoyed unimpressed' },
      { char: '😞', name: 'disappointed face sad regret' },
      { char: '😔', name: 'pensive face sorrowful down' },
      { char: '😟', name: 'worried face anxious nervous' },
      { char: '😕', name: 'confused face puzzled huh' },
      { char: '🙁', name: 'slightly frowning face unhappy' },
      { char: '🥺', name: 'pleading face puppy eyes please begs' },
      { char: '😢', name: 'crying face sad tear sorrow' },
      { char: '😭', name: 'loudly crying face sob weep tears sad' },
      { char: '😤', name: 'face with steam from nose proud angry victory' },
      { char: '😠', name: 'angry face mad pissed grumpy' },
      { char: '😡', name: 'pouting face enraged furious rage' },
      { char: '🤯', name: 'exploding head mind blown shock stunned' },
      { char: '😳', name: 'flushed face shocked surprised embarrassed' },
      { char: '🥵', name: 'hot face sweating heat spicy summer' },
      { char: '🥶', name: 'cold face freezing winter ice' },
      { char: '😱', name: 'face screaming in fear scared horror omg' },
      { char: '😨', name: 'fearful face scared terrified' },
      { char: '😰', name: 'anxious face with sweat worried nervous' },
      { char: '😥', name: 'sad but relieved face whew phew' },
      { char: '😓', name: 'downcast face with sweat stress tired' },
      { char: '🤗', name: 'smiling face with open hands hug hugs' },
      { char: '🤔', name: 'thinking face hmm wonder ponder curious' },
      { char: '🫣', name: 'face with peeking eye shy nervous peek' },
      { char: '🤭', name: 'face with hand over mouth oops giggle teehee' },
      { char: '🤫', name: 'shushing face quiet secret hush shh' },
      { char: '😶', name: 'face without mouth speechless quiet mute' },
      { char: '😐', name: 'neutral face straight poker face whatever' },
      { char: '😑', name: 'expressionless face blank deadpan' },
      { char: '😬', name: 'grimacing face awkward cringe yikes' },
      { char: '🫠', name: 'melting face warm heat disappear dissolve' },
      { char: '🙄', name: 'face with rolling eyes eye roll whatever bored' },
      { char: '😯', name: 'hushed face surprise gasp' },
      { char: '😮', name: 'face with open mouth whoa wow surprise' },
      { char: '😲', name: 'astonished face stunned shocked' },
      { char: '🥱', name: 'yawning face tired sleepy bored yawn' },
      { char: '😴', name: 'sleeping face zzz goodnight slumber' },
      { char: '🤤', name: 'drooling face hungry sleep craving' },
      { char: '😵', name: 'face with crossed-out eyes dead knocked out' },
      { char: '🤐', name: 'zipper mouth face silent secret zip' },
      { char: '🥴', name: 'woozy face dizzy drunk tipsey intoxicated' },
      { char: '🤢', name: 'nauseated face sick gross disgusted' },
      { char: '🤮', name: 'face vomiting barf puke sick gross' },
      { char: '🤧', name: 'sneezing face sneeze allergy achoo' },
      { char: '😷', name: 'face with medical mask sick doctor health' },
      { char: '🤒', name: 'face with thermometer fever sick illness' },
      { char: '🤕', name: 'face with head bandage hurt injured ouch' },
      { char: '🤖', name: 'robot face bot tech ai future' },
      { char: '👻', name: 'ghost spooky halloween boo spirit' },
      { char: '💀', name: 'skull dead skeleton ded' },
      { char: '☠️', name: 'skull and crossbones pirate danger toxic' }
    ]
  },
  gestures: {
    name: 'Hands',
    icon: '👋',
    emojis: [
      { char: '👍', name: 'thumbs up like good yes approve ok' },
      { char: '👎', name: 'thumbs down dislike bad no reject' },
      { char: '👊', name: 'oncoming fist brofist punch strike' },
      { char: '✊', name: 'raised fist power strength solidarity' },
      { char: '🤛', name: 'left-facing fist bump fistbump' },
      { char: '🤜', name: 'right-facing fist bump fistbump' },
      { char: '👏', name: 'clapping hands applause bravo congrats clap' },
      { char: '🙌', name: 'raising hands celebration praise hooray high five' },
      { char: '👐', name: 'open hands welcome hug' },
      { char: '🤲', name: 'palms up together prayer open dua' },
      { char: '🤝', name: 'handshake deal agree partnership partners' },
      { char: '🙏', name: 'folded hands pray please thanks namaste hope' },
      { char: '✌️', name: 'victory hand peace two v deuces' },
      { char: '🤞', name: 'crossed fingers luck hope wish fingers crossed' },
      { char: '🫰', name: 'hand with index finger and thumb crossed finger heart money love' },
      { char: '🤟', name: 'love-you gesture ily rock' },
      { char: '🤘', name: 'sign of the horns rock on metal concert' },
      { char: '🤙', name: 'call me hand shaka hang loose surf' },
      { char: '👈', name: 'backhand index pointing left point' },
      { char: '👉', name: 'backhand index pointing right point' },
      { char: '👆', name: 'backhand index pointing up point' },
      { char: '👇', name: 'backhand index pointing down point' },
      { char: '☝️', name: 'index pointing up one listen attention' },
      { char: '🫵', name: 'index pointing at the viewer you' },
      { char: '👋', name: 'waving hand wave hello hi bye goodbye' },
      { char: '🤚', name: 'raised back of hand stop high five' },
      { char: '🖐️', name: 'hand with fingers splayed five palm' },
      { char: '✋', name: 'raised hand stop high five wait' },
      { char: '🖖', name: 'vulcan salute spock peace live long trek' },
      { char: '👌', name: 'ok hand fine perfect good nice' },
      { char: '🤌', name: 'pinched fingers italian what do you want gesture' },
      { char: '🤏', name: 'pinching hand little small tiny bit' },
      { char: '💪', name: 'flexed biceps strong muscle fitness power gains' },
      { char: '🫡', name: 'saluting face salute respect yes sir' }
    ]
  },
  hearts: {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      { char: '❤️', name: 'red heart love like romance' },
      { char: '🧡', name: 'orange heart love care' },
      { char: '💛', name: 'yellow heart friendship sunshine love' },
      { char: '💚', name: 'green heart nature environment love' },
      { char: '💙', name: 'blue heart trust loyalty peace' },
      { char: '💜', name: 'purple heart luxury honor affection' },
      { char: '🖤', name: 'black heart dark emo sorrow gothic' },
      { char: '🤍', name: 'white heart pure clean peace angel' },
      { char: '🤎', name: 'brown heart earth chocolate coffee' },
      { char: '💔', name: 'broken heart heartbreak sad dump pain' },
      { char: '❤️‍🔥', name: 'heart on fire burning passion desire lit' },
      { char: '❤️‍🩹', name: 'mending heart healing recovery wellness' },
      { char: '❣️', name: 'heart exclamation emphasis love exclamation' },
      { char: '💕', name: 'two hearts love floating affection' },
      { char: '💞', name: 'revolving hearts love connection' },
      { char: '💓', name: 'beating heart pulse love alive' },
      { char: '💗', name: 'growing heart expanding love flutter' },
      { char: '💖', name: 'sparkling heart shiny love special sparkle' },
      { char: '💘', name: 'heart with arrow cupid love crush' },
      { char: '💝', name: 'heart with ribbon gift present love box' },
      { char: '💌', name: 'love letter romantic mail envelope note' }
    ]
  },
  web3: {
    name: 'Web3 & Tech',
    icon: '⚡',
    emojis: [
      { char: '💎', name: 'gem stone diamond hands hodl wealth shiny rich eth' },
      { char: '🚀', name: 'rocket to the moon launch pump fast space bull' },
      { char: '⚡', name: 'high voltage lightning bolt speed energy fast power electric' },
      { char: '🔥', name: 'fire lit hot hype trending burner' },
      { char: '🪙', name: 'coin crypto token gold currency money btc eth' },
      { char: '⛓️', name: 'chains blockchain on-chain link ledger smart contract' },
      { char: '🦊', name: 'fox metamask web3 wallet browser' },
      { char: '🌐', name: 'globe with meridians network internet decentralized p2p' },
      { char: '🔒', name: 'locked padlock security safe encrypted e2ee privacy' },
      { char: '🔑', name: 'key private key auth access secret password seed' },
      { char: '🦄', name: 'unicorn uniswap defi dex rare magic swap' },
      { char: '🪐', name: 'ringed planet saturn cosmos space multiverse ipfs' },
      { char: '🛡️', name: 'shield protection secure guard defend audited' },
      { char: '💰', name: 'money bag rich profit bag eth usdt yield' },
      { char: '💵', name: 'dollar banknote cash money payment fiat' },
      { char: '💸', name: 'money with wings transfer fees gas spend send' },
      { char: '📊', name: 'bar chart analytics volume metrics trading swap' },
      { char: '📈', name: 'chart increasing bullish up green pump stonks ath' },
      { char: '📉', name: 'chart decreasing bearish dump red dip bear' },
      { char: '🔮', name: 'crystal ball alpha prediction roadmap future vision' },
      { char: '👑', name: 'crown king whale top leader vip royalty' },
      { char: '🏆', name: 'trophy champion win first place reward victory' },
      { char: '🎯', name: 'bullseye target goal hit precision direct' },
      { char: '🤝', name: 'handshake deal contract partnership peer verify' }
    ]
  },
  coffee_food: {
    name: 'Coffee & Food',
    icon: '☕',
    emojis: [
      { char: '☕', name: 'hot beverage coffee tea espresso roast cup cafe mocha latte' },
      { char: '🍵', name: 'teacup without handle green tea matcha herbal' },
      { char: '🧋', name: 'bubble tea boba milk tea tapioca brown sugar' },
      { char: '🍩', name: 'doughnut donut sweet pastry glaze sprinkle snack' },
      { char: '🍪', name: 'cookie chocolate chip biscuit bakery sweet snack' },
      { char: '🥐', name: 'croissant butter french pastry bakery breakfast' },
      { char: '🥖', name: 'baguette bread french bakery loaf' },
      { char: '🥞', name: 'pancakes breakfast syrup brunch stack' },
      { char: '🧇', name: 'waffle breakfast belgian brunch butter' },
      { char: '🥪', name: 'sandwich lunch deli snack bread' },
      { char: '🍕', name: 'pizza slice pepperoni cheese italian dinner' },
      { char: '🍔', name: 'hamburger burger fast food diner beef' },
      { char: '🍟', name: 'french fries chips fast food snack potato' },
      { char: '🌮', name: 'taco mexican food spicy tortilla' },
      { char: '🌯', name: 'burrito mexican wrap food dinner' },
      { char: '🍣', name: 'sushi roll japanese salmon tuna fish' },
      { char: '🍜', name: 'steaming bowl ramen noodles soup pho asian' },
      { char: '🍝', name: 'spaghetti pasta italian food dinner tomato' },
      { char: '🍺', name: 'beer mug drink alcohol pub bar cheers lager' },
      { char: '🍻', name: 'clinking beer mugs toast cheers celebrate bar pints' },
      { char: '🥂', name: 'clinking glasses champagne toast celebrate party wine' },
      { char: '🍷', name: 'wine glass red wine bar drink grapes' },
      { char: '🍾', name: 'bottle with popping cork champagne celebrate pop party cork' }
    ]
  },
  celebration: {
    name: 'Party',
    icon: '🎉',
    emojis: [
      { char: '🎉', name: 'party popper celebrate tada congratulations yay victory' },
      { char: '🎊', name: 'confetti ball celebration party congrats festival' },
      { char: '🎈', name: 'balloon party birthday celebrate float' },
      { char: '🎂', name: 'birthday cake bday dessert candles sweet' },
      { char: '🎁', name: 'wrapped gift present surprise box holiday' },
      { char: '🎆', name: 'fireworks celebration festival night sky bang' },
      { char: '🎇', name: 'sparkler fireworks light party sparkles' },
      { char: '✨', name: 'sparkles shiny clean magic stars dazzle' },
      { char: '⭐', name: 'star favorite rating gold star bookmark' },
      { char: '🌟', name: 'glowing star special shine bright glow' },
      { char: '💫', name: 'dizzy star shooting star spark wish' },
      { char: '💥', name: 'collision explosion boom bang pow blast' },
      { char: '💯', name: 'hundred points score perfect 100 true facts keep it 100' },
      { char: '🚨', name: 'police car light siren emergency alert warning alarm' },
      { char: '🔔', name: 'bell notification alert ring chime notification' }
    ]
  },
  nature_animals: {
    name: 'Nature',
    icon: '🌿',
    emojis: [
      { char: '🐶', name: 'dog face puppy pet animal friend bark' },
      { char: '🐱', name: 'cat face kitten pet animal meow feline' },
      { char: '🦁', name: 'lion face king beast predator animal wild' },
      { char: '🐯', name: 'tiger face wild cat animal stripe' },
      { char: '🐻', name: 'bear face wild animal cute brown' },
      { char: '🐼', name: 'panda face bamboo animal cute bear' },
      { char: '🐨', name: 'koala australia animal cute eucalyptus' },
      { char: '🐸', name: 'frog face toad ribbit pepe animal green' },
      { char: '🐵', name: 'monkey face chimp animal ape cute' },
      { char: '🦄', name: 'unicorn magic fantasy animal horn' },
      { char: '🦅', name: 'eagle bird majestic freedom animal fly' },
      { char: '🦉', name: 'owl wise night bird animal hoot' },
      { char: '🦋', name: 'butterfly insect pretty nature flutter wings' },
      { char: '🐝', name: 'honeybee bee honey insect sting buzz' },
      { char: '🌸', name: 'cherry blossom flower sakura spring pink floral' },
      { char: '🌹', name: 'rose red flower romance love bloom' },
      { char: '🌻', name: 'sunflower yellow flower sunny summer seeds' },
      { char: '🌲', name: 'evergreen tree pine forest nature woods' },
      { char: '🌴', name: 'palm tree beach island tropical summer vacation' },
      { char: '🍀', name: 'four leaf clover lucky irish fortune clover' }
    ]
  }
};

export default function EmojiPicker({ onSelectEmoji, onClose, className = '', style = {} }) {
  const [activeCategory, setActiveCategory] = useState('pixel');
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        if (onCloseRef.current) onCloseRef.current();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filter emojis based on real-time search query
  const displayedEmojis = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return EMOJI_CATEGORIES[activeCategory]?.emojis || [];
    }
    // Search across all categories
    return Object.values(EMOJI_CATEGORIES)
      .flatMap(cat => cat.emojis)
      .filter(e => e.name.toLowerCase().includes(query) || e.char.includes(query));
  }, [searchQuery, activeCategory]);

  return (
    <div 
      className={`composer-emoji-popover ${className}`} 
      ref={popoverRef}
      style={style}
    >
      {/* Search Header */}
      <div className="emoji-search-container">
        <span className="emoji-search-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <PixelSearch size={14} color="#8b9bb4" />
        </span>
        <input 
          ref={searchInputRef}
          type="text" 
          className="emoji-search-input"
          placeholder="Search 250+ emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            type="button" 
            className="emoji-search-clear"
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories Nav (Hidden while searching) */}
      {!searchQuery && (
        <div className="emoji-categories-nav">
          {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              type="button"
              className={`emoji-cat-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
              title={cat.name}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="emoji-grid-body">
        {displayedEmojis.length > 0 ? (
          displayedEmojis.map((emojiObj, index) => (
            <button
              key={`${emojiObj.char}-${index}`}
              type="button"
              className="emoji-item-btn"
              title={emojiObj.name}
              onClick={() => {
                onSelectEmoji(emojiObj.char);
                if (onClose) onClose();
              }}
            >
              {emojiObj.char}
            </button>
          ))
        ) : (
          <div className="emoji-no-results">
            No emojis found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="emoji-popover-footer">
        {searchQuery ? `${displayedEmojis.length} results` : `${EMOJI_CATEGORIES[activeCategory]?.name} • ${displayedEmojis.length} emojis`}
      </div>
    </div>
  );
}
