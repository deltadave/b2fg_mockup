/*jshint esversion: 6 */
/*
 * XML Templates Module
 * 
 * Contains all XML template strings for D&D class features and abilities.
 * These templates are used to generate Fantasy Grounds XML for character features.
 * 
 * Templates organized by class:
 * - Tiefling racial traits
 * - Barbarian features
 * - Bard features  
 * - Cleric features
 * - Monk features
 * - Wizard features
 * - Artificer features (placeholder)
 */

// =============================================================================
// RACIAL TRAIT TEMPLATES
// =============================================================================

addTiefHellResist = " \
\t\t\t\t<actions>\n \
\t\t\t\t\t<id-00001>\n \
\t\t\t\t\t\t<durmod type=\"number\">0</durmod>\n \
\t\t\t\t\t\t<label type=\"string\">Hellish Resistance; RESIST: fire</label>\n \
\t\t\t\t\t\t<order type=\"number\">1</order>\n \
\t\t\t\t\t\t<targeting type=\"string\">self</targeting>\n \
\t\t\t\t\t\t<type type=\"string\">effect</type>\n \
\t\t\t\t\t</id-00001>\n \
\t\t\t\t</actions>\n \
\t\t\t\t<cast type=\"number\">0</cast>\n \
\t\t\t\t<description type=\"formattedtext\">\n \
\t\t\t\t\t<p>You have resistance to fire damage.</p>\n \
\t\t\t\t</description>\n \
\t\t\t\t<group type=\"string\">Racial Traits</group>\n \
\t\t\t\t<level type=\"number\">0</level>\n \
\t\t\t\t<locked type=\"number\">1</locked>\n \
\t\t\t\t<name type=\"string\">Tiefling: Hellish Resistance</name>\n \
\t\t\t\t<prepared type=\"number\">0</prepared>\n \
\t\t\t\t<ritual type=\"number\">0</ritual>\n \
\t\t\t\t<source type=\"string\">Tiefling</source>\n \
\t\t\t\t<type type=\"string\">racial</type>\n";

// =============================================================================
// BARBARIAN CLASS FEATURE TEMPLATES
// =============================================================================

addBarbarianRage = " \
\t\t\t\t<actions>\n \
\t\t\t\t\t<id-00001>\n \
\t\t\t\t\t\t<durmod type=\"number\">1</durmod>\n \
\t\t\t\t\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t\t\t\t\t<label type=\"string\">Rage; ADVCHK: strength; ADVSAV: strength; DMG: 4, melee; RESIST: bludgeoning, piercing, slashing</label>\n \
\t\t\t\t\t\t<order type=\"number\">1</order>\n \
\t\t\t\t\t\t<targeting type=\"string\">self</targeting>\n \
\t\t\t\t\t\t<type type=\"string\">effect</type>\n \
\t\t\t\t\t\</id-00001>\n \
\t\t\t\t</actions>\n \
\t\t\t\t<cast type=\"number\">0</cast>\n \
\t\t\t\t<description type=\"formattedtext\">\n \
\t\t\t\t\t<p>In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action. While raging, you gain the following benefits if you aren't wearing heavy armor:</p>\n \
\t\t\t\t\t<list>\n \
\t\t\t\t\t\t<li>You have advantage on Strength checks and Strength saving throws.</li>\n \
\t\t\t\t\t\t<li>When you make a melee weapon attack using Strength, you gain a bonus to the damage roll that increases as you gain levels as a barbarian, as shown in the Rage Damage column of the Barbarian table.</li>\n \
\t\t\t\t\t\t<li>You have resistance to bludgeoning, piercing, and slashing damage.</li>\n \
\t\t\t\t\t</list>\n \
\t\t\t\t\t\t<p>If you are able to cast spells, you can't cast them while raging.</p>\n \
\t\t\t\t\t\t<p>Your rage lasts for 1 minute. It ends early if you are knocked unconscious or if your turn ends and you have neither attacked a hostile creature since your last turn nor taken damage since then. You can also end your rage on your turn (no action required).</p>\n \
\t\t\t\t\t\t<p>Once you have raged the number of times shown for your barbarian level in the Rages column of the Barbarian table, you must finish a long rest before you can rage again.</p>\n \
\t\t\t\t</description>\n \
\t\t\t\t<group type=\"string\">Class Features</group>\n \
\t\t\t\t<level type=\"number\">0</level>\n \
\t\t\t\t<locked type=\"number\">1</locked>\n \
\t\t\t\t<name type=\"string\">Rage</name>\n \
\t\t\t\t<ritual type=\"number\">0</ritual>\n \
\t\t\t\t<source type=\"string\">Barbarian</source>\n";
addBarbarianDangerSense = " \
<actions>\n \
<id-00001>\n \
<apply type=\"string\">action</apply>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Danger Sense; ADVSAV: dexterity</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 2nd level, you gain an uncanny sense of when things nearby aren't as they should be, giving you an edge when you dodge away from danger.</p>\n \
<p>You have advantage on Dexterity saving throws against effects that originate within 30 feet of you, such as a trap or a spellcaster within that range. To gain this benefit, you cannot be blinded, deafened, or incapacitated.</p>\n \
</description>\n \
\t\t\t\t<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Danger Sense</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Barbarian</source>\n";

addBarbarianWolfTotemSpirit = " \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Rage Wolf; ADVATK: melee</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 3rd level, when you adopt this path, you choose a totem spirit and gain its feature. You must make or acquire a physical totem object- an amulet or similar adornment-that incorporates fur or feathers, claws, teeth, or bones of the totem animal. At your option, you also gain minor physical attributes that are reminiscent of your totem spirit. For example, if you have a bear totem spirit, you might be unusually hairy and thick&#62;skinned, or if your totem is the eagle, your eyes turn bright yellow.</p>\n \
\t<p>Your totem animal might be an animal related to those listed here but more appropriate to your homeland. For example, you could choose a hawk or vulture in place of an eagle.</p>\n \
\t<p><b>Bear. </b>While raging, you have resistance to all damage except psychic damage. The spirit of the bear makes you tough enough to stand up to any punishment.</p>\n \
\t<p><b>Eagle. </b>While you're raging and aren't wearing heavy armor, other creatures have disadvantage on opportunity attack rolls against you, and you can the Dash action as a bonus action on your turn. The spirit of the eagle makes you into a predator who can weave through the fray with ease.</p>\n \
\t<p><b>Wolf. </b>While you're raging, your friends have advantage on melee attack rolls against any hostile creature within 5 feet of you. The spirit of the wolf makes you a leader of hunters.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Totem Spirit (Wolf)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n \
<source type=\"string\">Barbarian</source>\n";

addBarbarianEagleTotemSpirit = " \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Rage Eagle; ADVCHK: strength; ADVSAV: strength; DMG: 4, melee; GRANTDISATK: opportunity; RESIST: bludgeoning, piercing, slashing</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 3rd level, when you adopt this path, you choose a totem spirit and gain its feature. You must make or acquire a physical totem object- an amulet or similar adornment-that incorporates fur or feathers, claws, teeth, or bones of the totem animal. At your option, you also gain minor physical attributes that are reminiscent of your totem spirit. For example, if you have a bear totem spirit, you might be unusually hairy and thick&#62;skinned, or if your totem is the eagle, your eyes turn bright yellow.</p>\n \
\t<p>Your totem animal might be an animal related to those listed here but more appropriate to your homeland. For example, you could choose a hawk or vulture in place of an eagle.</p>\n \
\t<p><b>Bear. </b>While raging, you have resistance to all damage except psychic damage. The spirit of the bear makes you tough enough to stand up to any punishment.</p>\n \
\t<p><b>Eagle. </b>While you're raging and aren't wearing heavy armor, other creatures have disadvantage on opportunity attack rolls against you, and you can the Dash action as a bonus action on your turn. The spirit of the eagle makes you into a predator who can weave through the fray with ease.</p>\n \
\t<p><b>Wolf. </b>While you're raging, your friends have advantage on melee attack rolls against any hostile creature within 5 feet of you. The spirit of the wolf makes you a leader of hunters.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Totem Spirit (Eagle)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n \
<source type=\"string\">Barbarian</source>\n";


addBarbarianBearTotemSpirit = " \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Rage Bear; ADVCHK: strength; ADVSAV: strength; DMG: 4, melee; RESIST: all, !psychic</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 3rd level, when you adopt this path, you choose a totem spirit and gain its feature. You must make or acquire a physical totem object- an amulet or similar adornment-that incorporates fur or feathers, claws, teeth, or bones of the totem animal. At your option, you also gain minor physical attributes that are reminiscent of your totem spirit. For example, if you have a bear totem spirit, you might be unusually hairy and thick&#62;skinned, or if your totem is the eagle, your eyes turn bright yellow.</p>\n \
\t<p>Your totem animal might be an animal related to those listed here but more appropriate to your homeland. For example, you could choose a hawk or vulture in place of an eagle.</p>\n \
\t<p><b>Bear. </b>While raging, you have resistance to all damage except psychic damage. The spirit of the bear makes you tough enough to stand up to any punishment.</p>\n \
\t<p><b>Eagle. </b>While you're raging and aren't wearing heavy armor, other creatures have disadvantage on opportunity attack rolls against you, and you can the Dash action as a bonus action on your turn. The spirit of the eagle makes you into a predator who can weave through the fray with ease.</p>\n \
\t<p><b>Wolf. </b>While you're raging, your friends have advantage on melee attack rolls against any hostile creature within 5 feet of you. The spirit of the wolf makes you a leader of hunters.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Totem Spirit (Bear)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n \
<source type=\"string\">Barbarian</source>\n";


addBarbarianWolfBeastAspect = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Aspect of the Beast (Wolf); Special tracking and movement</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 6th level, you gain a magical benefit based on the totem animal of your choice. You can choose the same animal you selected at 3rd level or a different one.</p>\n \
<p><b>Bear. </b>You gain the might of a bear. Your carrying capacity (including maximum load and maximum lift) is doubled, and you have advantage on Strength checks made to push, pull, lift, or break objects.</p>\n \
<p><b>Eagle. </b>You gain the eyesight of an eagle. You can see up to 1 mile away with no difficulty, able to discern even fine details as though looking at something no more than 100 feet away from you. Additionally, dim light doesn't impose disadvantage on your Wisdom (Perception) checks.</p>\n \
<p><b>Wolf. </b>You gain the hunting sensibilities of a wolf. You can track other creatures while traveling at a fast pace, and you can move stealthily while traveling at a normal pace (see chapter 8 for rules on travel pace).</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aspect of the Beast (Wolf)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<school type=\"string\">Class</school>\n \
<source type=\"string\">Barbarian</source>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n";

addBarbarianEagleBeastAspect = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Aspect of the Beast (Eagle); Special sight</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 6th level, you gain a magical benefit based on the totem animal of your choice. You can choose the same animal you selected at 3rd level or a different one.</p>\n \
<p><b>Bear. </b>You gain the might of a bear. Your carrying capacity (including maximum load and maximum lift) is doubled, and you have advantage on Strength checks made to push, pull, lift, or break objects.</p>\n \
<p><b>Eagle. </b>You gain the eyesight of an eagle. You can see up to 1 mile away with no difficulty, able to discern even fine details as though looking at something no more than 100 feet away from you. Additionally, dim light doesn't impose disadvantage on your Wisdom (Perception) checks.</p>\n \
<p><b>Wolf. </b>You gain the hunting sensibilities of a wolf. You can track other creatures while traveling at a fast pace, and you can move stealthily while traveling at a normal pace (see chapter 8 for rules on travel pace).</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aspect of the Beast (Eagle)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<school type=\"string\">Class</school>\n \
<source type=\"string\">Barbarian</source>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n";

addBarbarianBearBeastAspect = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Aspect of the Beast (Bear); ADVCHK: strength;</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 6th level, you gain a magical benefit based on the totem animal of your choice. You can choose the same animal you selected at 3rd level or a different one.</p>\n \
<p><b>Bear. </b>You gain the might of a bear. Your carrying capacity (including maximum load and maximum lift) is doubled, and you have advantage on Strength checks made to push, pull, lift, or break objects.</p>\n \
<p><b>Eagle. </b>You gain the eyesight of an eagle. You can see up to 1 mile away with no difficulty, able to discern even fine details as though looking at something no more than 100 feet away from you. Additionally, dim light doesn't impose disadvantage on your Wisdom (Perception) checks.</p>\n \
<p><b>Wolf. </b>You gain the hunting sensibilities of a wolf. You can track other creatures while traveling at a fast pace, and you can move stealthily while traveling at a normal pace (see chapter 8 for rules on travel pace).</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aspect of the Beast (Bear)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<school type=\"string\">Class</school>\n \
<source type=\"string\">Barbarian</source>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n";

addBarbarianRecklessAttack = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">1</durmod>\n \
<label type=\"string\">Reckless Attack; ADVATK: melee; GRANTADVATK:</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Starting at 2nd level, you can draw on your reserve of rage to throw aside all concern for defense and attack with fierce desperation. When you do so, you have advantage on melee weapon attack rolls using Strength during your turn, but attack rolls against you have advantage until your next turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Reckless Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Barbarian</source>\n";

addBarbarianFeralInstinct = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Feral Instinct; ADViNIT:</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>By 7th level, your instincts are so honed that you have advantage on initiative rolls.</p>\n \
<p>Additionally, if you are surprised at the beginning of combat and aren't incapacitated, you can act normally on your first turn, but only if you enter your rage on that turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Feral Instinct</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Barbarian</source>\n";

addBarbarianBrutalCritical = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Brutal Critical; DMG: 3d8, melee, critical</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Beginning at 9th level, you can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.</p>\n \
<p>This increases to two additional dice at 13th level and three additional dice at 17th level.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Brutal Critical</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Barbarian</source>\n";


addBarbarianRelentlessRage = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Relentless Rage - CON save;</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Starting at 11th level, your rage can keep you fighting despite grievous wounds. If you drop to 0 hit points while you're raging and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, you drop to 1 hit point instead.</p>\n \
<p>Each time you use this feature after the first, the DC increases by 5. When you finish a short or long rest, the DC resets to 10.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Relentless Rage</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Barbarian</source>\n";

addBarbarianTotemicAttunement = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">1</durmod>\n \
<durunit type=\"string\">minute</durunit>\n \
<label type=\"string\">GRANTDISATK:</label>\n \
<order type=\"number\">1</order>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 14th level, you gain a magical benefit based on a totem animal of your choice. You can choose the same animal you selected at 3rd level or a different one.</p>\n \
<p><b>Bear. </b>While you're raging, any creature within 5 feet of you that's hostile to you has disadvantage on attack rolls against targets other than you. An enemy is immune to this effect if it can't see or hear you or if it can't be frightened.</p>\n \
<p><b>Eagle. </b>While raging, you have a fly speed equal to your current speed. This benefit works only in short bursts; you fall if you end your turn in the air and nothing else is holding you aloft.</p>\n \
<p><b>Wolf. </b>While you're raging, you can use a bonus action on your turn to knock a Large or smaller creature prone when you hit it with melee weapon attack.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Totemic Attunement (Bear)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Path of the Totem Warrior</specialization>\n \
<source type=\"string\">Barbarian</source>\n";


addBarbarianMindlessRage = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">1</durmod>\n \
<durunit type=\"string\">minute</durunit>\n \
<label type=\"string\">Rage; ADVCHK: strength; ADVSAV: strength; DMG: 4, melee; RESIST: bludgeoning, piercing, slashing; IMMUNE: charmed; IMMUNE: frightened</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Beginning at 6th level, you cannot be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Mindless Rage</name>\n \
<prepared type=\"number\">6</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Path of the Berserker</specialization>\n \
<source type=\"string\">Barbarian</source>\n";


addBarbarianIntimidatingPresence = " \
<actions>\n \
<id-00001>\n \
<atkmod type=\"number\">0</atkmod>\n \
<atkprof type=\"number\">1</atkprof>\n \
<order type=\"number\">1</order>\n \
<savedcbase type=\"string\">ability</savedcbase>\n \
<savedcmod type=\"number\">0</savedcmod>\n \
<savedcprof type=\"number\">1</savedcprof>\n \
<savedcstat type=\"string\">charisma</savedcstat>\n \
<savetype type=\"string\">wisdom</savetype>\n \
<type type=\"string\">cast</type>\n \
</id-00001>\n \
<id-00002>\n \
<durmod type=\"number\">1</durmod>\n \
<label type=\"string\">Frightened</label>\n \
<order type=\"number\">2</order>\n \
<type type=\"string\">effect</type>\n \
</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Beginning at 10th level, you can use your action to roar frighteningly at someone. When you do so, choose one creature that you can see within 30 feet of you. If the creature can see or hear you, it must succeed on a Wisdom saving throw (DC equal to 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn. On subsequent turns, you can use your action to extend the duration of this effect on the frightened creature until the end of your next turn. This effect ends if the creature ends it turn out of line of sight or more than 60 feet away from you.</p>\n \
<p>If the creature succeeds on its saving throw, you can't use this feature on that creature again for 24 hours.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Intimidating Presence</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Path of the Berserker</specialization>\n \
<source type=\"string\">Barbarian</source>\n";


/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Barbarian effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Bard effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addBardJackOfAllTrades = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Jack of all Trades; INIT:[HPRF]</label>\n \
<order type=\"number\">1</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
<id-00002>\n \
<apply type=\"string\">roll</apply>\n \
<durmod type=\"number\">0</durmod>\n \
<label type=\"string\">Jack of all Trades; CHECK:[HPRF], all</label>\n \
<order type=\"number\">2</order>\n \
<targeting type=\"string\">self</targeting>\n \
<type type=\"string\">effect</type>\n \
</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Starting at 2nd level, you can add half your proficiency bonus, rounded down, to any ability check you make that doesn't already include that bonus.</p>\n \
</description>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Jack of All Trades</name>\n \
<prepared type=\"number\">0</prepared>\n \
<group type=\"string\">Class Features</group>\n \
<source type=\"string\">Bard</source>\n";

addBardicInspiration = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">10</durmod>\n \
<durunit type=\"string\">minute</durunit>\n \
<label type=\"string\">Bardic Inspiration;</label>\n \
<order type=\"number\">1</order>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>You can inspire others through stirring words or music. To do so, you use a bonus action on your turn to choose one creature other than yourself within 60 feet of you who can hear you. That creature gains one Bardic Inspiration die, a d6.</p>\n \
<p>Once within the next 10 minutes, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw that it just made. The creature can wait until after it rolls the die for the ability check, attack roll, or saving throw, but before the DM says whether or not it succeeds or fails before deciding to use the Bardic Inspiration die. Once the Bardic Inspiration die is rolled, it is lost. A creature can have only one Bardic Inspiration die at a time.</p>\n \
<p>You can use this feature a number of times equal to your Charisma modifier (a minimum of once). You regain any expended uses when you finish a long rest.</p>\n \
<p>Your Bardic Inspiration die changes when you reach certain levels in this class. The die becomes a d8 at 5th level, a d10 at 10th level, and a d12 at 15th level.</p>\n \
</description>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<group type=\"string\">Class Features</group>\n \
<name type=\"string\">Bardic Inspiration</name>\n \
<source type=\"string\">Bard</source>\n";

addBardSongOfRest = " \
<actions>\n \
<id-00001>\n \
<heallist>\n \
<id-00001>\n \
<bonus type=\"number\">0</bonus>\n \
<dice type=\"dice\">d12</dice>\n \
</id-00001>\n \
</heallist>\n \
<order type=\"number\">1</order>\n \
<type type=\"string\">heal</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Beginning at 2nd level, you can use soothing music or oration to help revitalize your wounded allies during a short rest. If you or any friendly creature who can hear your performance regains any hit points during the short rest, that creature regains 1d6 extra hit points at the end of the rest. A creature regains the extra hit points only if it spends one or more Hit Dice at the end of the short rest.</p>\n \
<p>The extra hit points increase when you reach certain levels in this class: 1d8 at 9th level, 1d10 at 13th level, and 1d12 at 17th level.</p>\n \
</description>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Song of Rest</name>\n \
<prepared type=\"number\">0</prepared>\n \
<group type=\"string\">Class Features</group>\n \
<source type=\"string\">Bard</source>\n";

addBardCountercharm = " \
<actions>\n \
<id-00001>\n \
<durmod type=\"number\">1</durmod>\n \
<label type=\"string\">Countercharm;</label>\n \
<order type=\"number\">1</order>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 6th level, you gain the ability to use musical notes or words of power to disrupt mind5 influencing effects. As an action, you can start a performance that lasts until the end of your next turn. During that time, you and any friendly creature within 30 feet of you have advantage on saving throws against being frightened or charmed. A creature must be able to hear you to gain this benefit. The performance ends early if you are incapacitated or silenced or you voluntarily end it (no action required).</p>\n \
</description>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Countercharm</name>\n \
<prepared type=\"number\">0</prepared>\n \
<group type=\"string\">Class Features</group>\n \
<source type=\"string\">Bard</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Bard effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Cleric effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addClericTurnUndead = " \
<actions>\n \
<id-00001>\n \
<order type=\"number\">1</order>\n \
<savetype type=\"string\">wisdom</savetype>\n \
<type type=\"string\">cast</type>\n \
</id-00001>\n \
<id-00002>\n \
<durmod type=\"number\">1</durmod>\n \
<durunit type=\"string\">minute</durunit>\n \
<label type=\"string\">Turned</label>\n \
<order type=\"number\">2</order>\n \
<type type=\"string\">effect</type>\n \
</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>At 2nd level, you gain the ability to channel divine energy directly from your deity, using that energy to fuel magical effects. You start with two such effects - Turn Undead and an effect determined by your domain. Some domains grant you additional effects as you advance in levels, as noted in the domain description.</p>\n \
<p>When you use your Channel Divinity, you choose which effect to create. You must then finish a short or long rest to use your Channel Divinity again.</p>\n \
<p>Some Channel Divinity effects require saving throws. When you use such an effect from this class, the DC equals your cleric spell save DC.</p>\n \
<p>Beginning at 6th level, you can use your Channel Divinity twice between rests, and beginning at 18th level, you can use it three times between rests. When you finish a short or long rest, you regain your expended uses.</p>\n \
<p><b>Channel Divinity: </b>Turn Undead</p>\n \
<p>As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet of you must make a Wisdom saving throw. If the creature fails its saving throw, it is turned for 1 minute or until it takes any damage.</p>\n \
<p>A turned creature must spend its turns trying to move as far away from you as it can, and it can't willingly move to a space within 30 feet of you. It also can't take reactions. For its action, it can use only the Dash action or try to escape from an effect that prevents it from moving. If there's nowhere to move, the creature can use the Dodge action.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Turn Undead</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Cleric</source>\n";

addClericArcaneAbjuration = " \
<actions>\n \
<id-00001>\n \
<order type=\"number\">1</order>\n \
<savetype type=\"string\">wisdom</savetype>\n \
<type type=\"string\">cast</type>\n \
</id-00001>\n \
<id-00002>\n \
<durmod type=\"number\">1</durmod>\n \
<durunit type=\"string\">minute</durunit>\n \
<label type=\"string\">Turned</label>\n \
<order type=\"number\">2</order>\n \
<type type=\"string\">effect</type>\n \
</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Starting at 2nd level, you can use your Channel Divinity to abjure otherworldly creatures.</p>\n \
<p>As an action, you present your holy symbol, and one celestial, elemental, fey, or fiend of your choice that is within 30 feet of you must make a Wisdom saving throw, provided that the creature can see or hear you. If the creature fails its saving throw, it is turned for 1 minute or until it takes any damage.</p>\n \
<p>A turned creature must spend its turns trying to move as far away from you as it can, and it can't willingly end its move in a space within 30 feet of you. It also can't take reactions. For its action, it can only use the Dash action or try to escape from an effect that prevents it from moving. If there's nowhere to move, the creature can use the Dodge action.</p>\n \
<p>After you reach 5th level, when a creature fails its saving throw against your Arcane Abjuration feature, the creature is banished for 1 minute (as in the banishment spell, no concentration required) if it isn't on its plane of origin and its challenge rating is at or below a certain threshold, as shown on the Arcane Banishment table.</p>\n \
<table>\n \
<tr>\n \
<td colspan=\"5\"><b>Arcane Banishment</b></td>\n \
</tr>\n \
<tr>\n \
<td>Cleric Level</td>\n \
<td colspan=\"4\">Banishes Creatures of CR...</td>\n \
</tr>\n \
<tr>\n \
<td>5th</td>\n \
<td colspan=\"4\">1/2 or lower</td>\n \
</tr>\n \
<tr>\n \
<td>8th</td>\n \
<td colspan=\"4\">1 or lower</td>\n \
</tr>\n \
<tr>\n \
<td>11th</td>\n \
<td colspan=\"4\">2 or lower</td>\n \
</tr>\n \
<tr>\n \
<td>14th</td>\n \
<td colspan=\"4\">3 or lower</td>\n \
</tr>\n \
<tr>\n \
<td>17th</td>\n \
<td colspan=\"4\">4 or lower</td>\n \
</tr>\n \
</table>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Arcane Abjuration</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Arcana Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericCharmAnimals = " \
<actions>\n \
<id-00001>\n \
<label type=\"string\">Charmed</label>\n \
<order type=\"number\">1</order>\n \
<type type=\"string\">effect</type>\n \
</id-00001>\n \
<id-00002>\n \
<atkmod type=\"number\">0</atkmod>\n \
<atkprof type=\"number\">1</atkprof>\n \
<order type=\"number\">2</order>\n \
<savedcmod type=\"number\">0</savedcmod>\n \
<savedcprof type=\"number\">1</savedcprof>\n \
<savetype type=\"string\">wisdom</savetype>\n \
<type type=\"string\">cast</type>\n \
</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Starting at 2nd level, you can use your Channel Divinity to charm animals and plants.</p>\n \
<p>As an action, you present your holy symbol and invoke the name of your deity. Each beast or plant creature that can see you within 30 feet of you must make a Wisdom saying throw. If the creature fails its saving throw, it is charmed by you for 1 minute or until it takes damage. While it is charmed by you, it is friendly to you and other creatures you designate,</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Channel Divinity: Charm Animals And Plants</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Nature Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericPreserveLife = " \
<actions>\n \
<id-00001>\n \
<heallist>\n \
<id-00001>\n \
<bonus type=\"number\">5</bonus>\n \
<dice type=\"dice\"></dice>\n \
</id-00001>\n \
</heallist>\n \
<order type=\"number\">1</order>\n \
<type type=\"string\">heal</type>\n \
</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
<p>Starting at 2nd level, you can use your Channel Divinity to heal the badly injured.</p>\n \
<p>As an action, you present your holy symbol and evoke healing energy that can restore a number of hit points equal to five times your cleric level. Choose any creatures within 30 feet of you, and divide those hit points among them. This feature can restore a creature to no more than half of its hit point maximum. You can't use this feature on an undead or a construct.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Preserve Life</name>\n \
<prepared type=\"number\">20</prepared>\n \
<specialization type=\"string\">Life Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";


addClericBlessedHealer=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">3</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">4</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
\t<description type=\"formattedtext\">\n \
\t\t<p>Beginning at 6th level, the healing spells you cast on others heal you as well. When you cast a spell of 1st level or higher that restores hit points to a creature other than you, you regain hit points equal to 2 + the spell's level.</p>\n \
\t</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Blessed Healer</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Life Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericCureWoundsSupreme=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">8</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">wisdom</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<castingtime type=\"string\">1 action</castingtime>\n \
<components type=\"string\">V, S</components>\n \
<description type=\"formattedtext\">\n \
\t<p>A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.</p>\n \
\t<p><b>At Higher Levels. </b>When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.</p>\n \
</description>\n \
<duration type=\"string\">Instantaneous</duration>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">1</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Cure Wounds (Supreme Heal)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<range type=\"string\">Touch</range>\n \
<school type=\"string\">Evocation</school>\n \
<source type=\"string\">Bard, Cleric, Cleric Life Domain, Druid, Paladin, Ranger</source>\n";

addClericCureWoundsLife=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">3</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t\t<stat type=\"string\">base</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<castingtime type=\"string\">1 action</castingtime>\n \
<components type=\"string\">V, S</components>\n \
<description type=\"formattedtext\">\n \
\t<p>A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.</p>\n \
\t<p><b>At Higher Levels. </b>When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.</p>\n \
</description>\n \
<duration type=\"string\">Instantaneous</duration>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">1</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Cure Wounds (Disciple of Life)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<range type=\"string\">Touch</range>\n \
<school type=\"string\">Evocation</school>\n \
<source type=\"string\">Bard, Cleric, Cleric Life Domain, Druid, Paladin, Ranger</source>\n";

addClericWardingFlare=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DISATK:</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Also at 1st level, you can interpose divine light between yourself and an attacking enemy. When you are attacked a creature within 30 feet of you that you can see, you can use your reaction to impose disadvantage on the attack roll, causing light to flare before the attacker before it hits or misses. An attacker that can't be blinded is immune to this feature.</p>\n \
\t<p>You can use this feature a number of times equal to your Wisdom modifier (a minimum of once). You regain all expended uses when you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Warding Flare</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Light Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericRadianceOfDawn=" \
<actions>\n \
\t<id-00001>\n \
\t\t<onmissdamage type=\"string\">half</onmissdamage>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">constitution</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t<id-00001>\n \
\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t<dice type=\"dice\">d10,d10</dice>\n \
\t\t\t<stat type=\"string\">cleric</stat>\n \
\t\t\t<type type=\"string\">radiant</type>\n \
\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, you can use your Channel Divinity so harness sunlight, banishing darkness and dealing additional damage to your foes.</p>\n \
\t<p>As an action, you present your holy symbol, and any magical darkness within 30 feet of you is dispelled. Additionally each hostile creature within 30 feet of you must make a Constitution saving throw. A creature takes radiant damage equal to 2d10 + your cleric level on a failed saving throw, and half as much damage on a successful one. A creature that has total cover from you is not affected.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Channel Divinity: Radiance of the Dawn</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Light Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericCoronaOfLight=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">DISSAV: dexterity</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 17th level, you can use your action to activate in aura of sunlight that lasts for 1 minute or until you dismiss it using another action. You emit bright light in a 60-foot radius and dim light 30 feet beyond that. Your enemies in the bright light have disadvantage on saving throws against any spell that deals fire or radiant magic.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Corona of Light</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Light Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericDampenElements=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST: acid,cold,fire,lightning,thunder</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, when you or a creature within 30 feet of you takes acid, cold, fire, lightning, or thunder damage, you can use your reaction to grant resistance to the creature against that instance of the damage.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Dampen Elements</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Nature Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericDivineStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<label type=\"string\">DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 8th level, you gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns when you hit a creature with a weapon attack, you can cause the attack- to deal an extra 1d8 damage of the same type dealt by the weapon to the target. When you reach 14th level, the extra damage increases to 2d8.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Divine Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">War Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericWrathOfTheStorm=" \
<actions>\n \
\t<id-00001>\n \
\t\t<onmissdamage type=\"string\">half</onmissdamage>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">dexterity</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8,d8</dice>\n \
\t\t\t\t<type type=\"string\">lightning</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8,d8</dice>\n \
\t\t\t\t<type type=\"string\">thunder</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Also at 1st level, you can thunderously rebuke attackers. When a creature within 5 feet of you that you can see hits you with an attack. you can use your reaction to cause the creature to make a Dexterity saving throw. The creature takes 2d8 lightning or thunder damage (your choice) on a failed saving throw, and half as much damage on a successful one.</p>\n \
\t<p>You can use this feature a number of times equal to your Wisdom modifier (a minimum of once). You regain all expended uses when you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Wrath of the Storm</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">Tempest Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericBlessingOfTheTrickster=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">hour</durunit>\n \
\t\t<label type=\"string\">ADVSKILL:stealth</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting when you choose this domain at 1st level, you can use your action to touch a willing creature other than yourself to give it advantage on Dexterity (Stealth) checks. This blessing lasts for 1 hour or until you use this feature again.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Blessing of the Trickster</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Trickery Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericCloakOfShadows=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Invisible</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, you can use your Channel Divinity to vanish.</p>\n \
\t<p>As an action, you become invisible until the end of your next turn. You become visible if you attack or cast a spell.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Channel Divinity: Cloak of Shadows</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Trickery Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericWarPriest=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>From 1st level, your god delivers bolts of inspiration to you while you are engaged in battle. When you use the Attack action, you can make one weapon attack as a bonus action.</p>\n \
\t<p>You can use this feature a number of times equal to your Wisdom modifier (a minimum of once). You regain all expended uses when you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">War Priest</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">War Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

addClericAvatarOfBattle=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST:bludgeoning,piercing,slashing,!magic</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 17th level, you gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Avatar of Battle</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">War Domain</specialization>\n \
<source type=\"string\">Cleric</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Cleric effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Druid effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addDruidLandStride=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Land's Stride; ADVSAV:all</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard.</p>\n \
\t<p>In addition, you have advantage on saving throws against plants that are magically created or manipulated to impede movement, such those created by the entangle spell.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Land's Stride</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Druid</source>\n \
<specialization type=\"string\">Circle of the Land</specialization>\n";

addDruidNaturalRecovery=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, you can regain some of your magical energy by sitting in meditation and communing with nature. Once per day during a short rest, you choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your druid level (rounded up), and none of the slots can be 6th level or higher.</p>\n \
\t<p>For example, when you area 4th-level druid, you can recover up to two levels worth of spell slots. You can recover either a 2nd-level spell slot or two 1st-level spell slots.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Natural Recovery</name>\n \
<prepared type=\"number\">1</prepared>\n \
<source type=\"string\">Druid</source>\n \
<specialization type=\"string\">Circle of the Land</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n";

addDruidNaturesSanctuary=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you reach 14th level, creatures of the natural world sense your connection to nature and become hesitant to attack you. When a beast or plant creature attacks you, that creature must make a Wisdom saving throw against your druid spell save DC. On a failed save, the creature must choose a different target, or the attack automatically misses. On a successful save, the creature is immune to this effect for 24 hours.</p>\n \
\t<p>The creature is aware of this effect before it makes its attack against you.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Nature's Sanctuary</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Druid</source>\n \
<specialization type=\"string\">Circle of the Land</specialization>\n";

addDruidWildShape=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, you can use your action to magically assume the shape of a beast. You can use this feature twice, and you regain expended uses when you finish a short or long rest.</p>\n \
\t<p>Your druid level determines the beasts you can transform into, as shown in the Beast Shapes table. At 2nd level, for example, you can transform into any beast that has a Challenge Rating of 1/4 or lower that doesn't have a fly or swim speed.</p>\n \
\t<p><b>Beast Shapes</b></p>\n \
\t<table>\n \
\t\t<tr>\n \
\t\t\t<td><b>Level</b></td>\n \
\t\t\t<td><b>Max. CR</b></td>\n \
\t\t\t<td><b>Limitations</b></td>\n \
\t\t\t<td><b>Example</b></td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>2nd</td>\n \
\t\t\t<td>1/4</td>\n \
\t\t\t<td>No flying or swimming speed</td>\n \
\t\t\t<td>Wolf</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>4th</td>\n \
\t\t\t<td>1/2</td>\n \
\t\t\t<td>No fying speed</td>\n \
\t\t\t<td>Crocodile</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>8th</td>\n \
\t\t\t<td>1</td>\n \
\t\t\t<td>-</td>\n \
\t\t\t<td>Giant eagle</td>\n \
\t\t</tr>\n \
\t</table>\n \
\t<p>You can stay in a beast shape for a number of hours equal to half your druid level (rounded down). You then revert to your normal form unless you expend another use of this feature.</p>\n \
\t<p>You can revert to your normal form earlier by using a bonus action on your turn. You automatically revert to your normal form if you fall unconscious, drop to 0 hit points, or die.</p>\n \
\t<p>While you are transformed, the following rules apply:</p>\n \
\t<list>\n \
\t\t<li>Your game statistics are replaced by the statistics of the beast, but you retain your alignment and your Intelligence, Wisdom, and Charisma scores. You also retain all of your skill and saving throw proficiencies, in addition to gaining those of the creature. If both you and the creature have the same proficiency, use only the higher bonus.</li>\n \
\t\t<li>When you transform, you assume the beast's hit points. When you revert to your normal form, you return to the number of hit points you had before you transformed. If you revert as a result of dropping to 0 hit points, however, any excess damage carries over to your normal form. For example, if you take 10 damage in animal form and have only 1 hit point left, you revert to your normal form and take 9 damage.</li>\n \
\t\t<li>You can't cast spells, speak, or take any action that requires hands. Transforming doesn't break your concentration on a spell you've already cast, however, or prevent you from taking actions that are part of a spell you've already cast, such as call lightning.</li>\n \
\t\t<li>You retain the benefit of any feature from your class, race, or other source and can use them if the new form is physically capable of doing so. However, you can't use any of your special senses, such as darkvision, unless your new form also has that sense.</li>\n \
\t\t<li>You choose whether your equipment falls to the ground in your space, merges into your new form, or is worn by it. Worn equipment functions as normal, but the DM decides whether it is practical for the new form to wear a piece of equioment, based on the creature's shape or size. Your equipment doesn't change size or shape to match the new form, and any equipment that the new form can't wear must either fall to the ground or merge with it. Equipment that merges with the form has no effect until you leave the form.</li>\n \
\t</list>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Wild Shape</name>\n \
<prepared type=\"number\">2</prepared>\n \
<source type=\"string\">Druid</source>\n \
<usesperiod type=\"string\">enc</usesperiod>\n";

addDruidNaturesWard=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IMMUNE:poison; IMMUNE:poisoned; IFT:TYPE(elemental,fey);IMMUNE:charmed;IMMUNE:frightened</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Nature's Ward;IMMUNE: disease</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you reach 10th level, you can't be charmed or frightened by elementals or fey, and you are immune to poison and disease.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Nature's Ward</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Circle of the Land</specialization>\n \
<source type=\"string\">Druid</source>\n";

addDruidCombatWildShape=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8,d8</dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you choose this circle at 2nd level, you gain the ability to use Wild Shape on your turn as a bonus action, rather than as an action.</p>\n \
\t<p>Additionally, while you are transformed by Wild Shape, you can use a bonus action to expend one spell slot to regain 1d8 hit points per level of the spell slot expended.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Combat Wild Shape</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Circle of the Moon</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Druid</source>\n";

addDruidPrimalStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DMGTYPE:magic</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, your attacks in beast form count as being magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Primal Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Circle of the Moon</specialization>\n \
<source type=\"string\">Druid</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Druid effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Fighter effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addFighterActionSurge=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action on top of your regular action and a possible bonus action.</p>\n \
\t<p>Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Action Surge</name>\n \
<prepared type=\"number\">2</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Fighter</source>\n \
<usesperiod type=\"string\">enc</usesperiod>\n";

addFighterIndomitable=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 9th level, you can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can't use this feature again until you finish a long rest.</p>\n \
\t<p>You can use this feature twice between long rests starting at 13th level and three times between long rests starting at 17th level.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Indomitable</name>\n \
<prepared type=\"number\">4</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Fighter</source>\n";

addFighterSecondWind=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10</dice>\n \
\t\t\t\t<stat type=\"string\">fighter</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.</p>\n \
\t<p>Once you use this feature, you must finish a short or long rest before you can use it again.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Second Wind</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n \
<usesperiod type=\"string\">enc</usesperiod>\n";

addFighterRallyingCry=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">fighter</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you choose this archetype at 3rd level, you learn how to inspire your allies to fight on past their injuries.</p>\n \
\t<p>When you use your Second Wind feature, you can choose up to three creatures within 60 feet of you that are allied with you. Each one regains hit points equal to your fighter level, provided that the creature can see or hear you.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Rallying Cry</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Purple Dragon Knight</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Fighter</source>\n";

addFighterRoyalEnvoy=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">SKILL:[PRF], persuasion</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>A Purple Dragon knight serves as an envoy of the Cormyrean crown. Knights of high standing are expected to conduct themselves with grace.</p>\n \
\t<p>At 7th level, you gain proficiency in the Persuasion skill. If you are already proficient in it, you gain proficiency in one of the following skills of your choice: Animal Handling, Insight, Intimidation, or Performance.</p>\n \
\t<p>Your proficiency bonus is doubled for any ability check you make that uses Persuasion. You receive this benefit regardless of the skill proficiency you gain from this feature.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Royal Envoy</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Purple Dragon Knight</specialization>\n \
<source type=\"string\">Fighter</source>\n";

addFighterRemarkableAthlete=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">CHECK:[HPRF], strength; CHECK:[HPRF],dexterity; CHECK:[HPRF],constitution</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">INIT:[HPRF]</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 7th level, you can add half your proficiency bonus (round up) to any Strength, Dexterity, or Constitution check you make that doesn't already use your proficiency bonus.</p>\n \
\t<p>In addition, when you make a running long jump, the distance you can cover increases by a number of feet equal to your Strength modifier.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Remarkable Athlete</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Champion</specialization>\n \
<source type=\"string\">Fighter</source>\n";

addFighterSurvivor=" \
<actions>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IF:Bloodied; REGEN:5 [CON]</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 18th level, you attain the pinnacle of resilience in battle. At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half of your hit points left. You don't gain this benefit if you have 0 hit points.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Survivor</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Champion</specialization>\n \
<source type=\"string\">Fighter</source>\n";

addFighterCombatSuperiority=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you choose this archetype at 3rd level, you learn maneuvers that are fueled by special dice called superiority dice.</p>\n \
\t<p><b>Maneuvers. </b>You learn three maneuvers of your choice, which are detailed under &#34;Maneuvers&#34; below. Many maneuvers enhance an attack in some way. You can use only one maneuver per attack.</p>\n \
\t<p>You learn two additional maneuvers of your choice at 7th, 10th, and 15th level. Each time you learn new maneuvers, you can also replace one maneuver you know with a different one.</p>\n \
\t<p><b>Maneuvers</b></p>\n \
\t<p>The maneuvers are presented in alphabetical order.</p>\n \
\t<table>\n \
\t\t<tr>\n \
\t\t\t<td><b>Maneuver</b></td>\n \
\t\t\t<td colspan=\"3\"><b>Description</b></td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Commander's Strike</b></td>\n \
\t\t\t<td colspan=\"3\">When you take the Attack action on your turn, you can forgo one of your attacks and use a bonus action to direct one of your companions to strike. When you do so, choose a friendly creature who can see or hear you and expend one superiority die. That creature can immediately use its reaction to make one weapon attack, adding the superiority die to the attack's damage roll.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Disarming Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to attempt to disarm the target, forcing it to drop one item of your choice that it's holding. You add the superiority die to the attack's damage roll, and the target must make a Strength saving throw. On a failed save, it drops the object you choose. The object lands at its feet.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Distracting Strike</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to distract the creature, giving your allies an opening. You add the superiority die to the attack's damage roll. The next attack roll against the target by an attacker other than you has advantage if the attack is made before the start of your next turn.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Evasive Footwork</b></td>\n \
\t\t\t<td colspan=\"3\">When you move, you can expend one superiority die, rolling the die and adding the number rolled to your AC until you stop moving.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Feinting Attack.</b></td>\n \
\t\t\t<td colspan=\"3\">You can expend one superiority die and use a bonus action on your turn to feint, choosing one creature within 5 feet of you as your target. You have advantage on your next attack roll against that creature. If that attack hits, add the superiority die to the attack's damage roll. The advantage is lost if not used on the turn you gain it.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Goading Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to attempt to goad the target into attacking you. You add the superiority die to the attack's damage roll, and the target must make a Wisdom saving throw. On a failed save, the target has disadvantage on all attack rolls against targets other than you until the end of your next turn.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Lunging Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you make a melee weapon attack on your turn, you can expend one superiority die to increase your reach for that attack by 5 feet. If you hit, you add the superiority die to the attack's damage roll.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Maneuvering Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to maneuver one of your comrades into a more advantageous position. You add the superiority die to the attack's damage roll, and you choose a friendly creature who can see or hear you. That creature can use its reaction to move up to half its speed without provoking opportunity attacks from the target of your attack.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Menacing Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to attempt to frighten the target. You add the superiority die to the attack's damage roll, and the target must make a Wisdom saving throw. On a failed save, it is frightened of you until the end of your next turn.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Parry</b></td>\n \
\t\t\t<td colspan=\"3\">When another creature damages you with a melee attack, you can use your reaction and expend one superiority die to reduce the damage by the number you roll on your superiority die + your Dexterity modifier.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Precision Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you make a weapon attack roll against a creature, you can expend one superiority die to add it to the roll. You can use this maneuver before or after making the attack roll, but before any effects of the attack are applied.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Pushing Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to attempt to drive the target back. You add the superiority die to the attack's damage roll, and if the target is Large or smaller, it must make a Strength saving throw. On a failed save, you push the target up to 15 feet away from you.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Rally</b></td>\n \
\t\t\t<td colspan=\"3\">On your turn, you can use a bonus action and expend one superiority die to bolster the resolve of one of your companions. When you do so, choose a friendly creature who can see or hear you. That creature gains temporary hit points equal to the superiority die roll + your Charisma modifier.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Riposte</b></td>\n \
\t\t\t<td colspan=\"3\">When a creature misses you with a melee attack, you can use your reaction and expend one superiority die to make a melee weapon attack against the creature. If you hit, you add the superiority die to the attack's damage roll.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Sweeping Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a melee weapon attack, you can expend one superiority die to attempt to damage another creature with the same attack. Choose another creature within 5 feet of the original target and within your reach. If the original attack roll would hit the second creature, it takes damage equal to the number you roll on your superiority die. The damage is of the same type dealt by the original attack.</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td><b>Trip Attack</b></td>\n \
\t\t\t<td colspan=\"3\">When you hit a creature with a weapon attack, you can expend one superiority die to attempt to knock the target down. You add the superiority die to the attack's damage roll, and if the target is Large or smaller, it must make a Strength saving throw. On a failed save, you knock the target prone.</td>\n \
\t\t</tr>\n \
\t</table>\n \
\t<p><b>Superiority Dice. </b>You have four superiority dice, which are d8s. A superiority die is expended when you use it. You regain all of your expended superiority dice when you finish a short or long rest.</p>\n \
\t<p>You gain another superiority die at 7th level and one more at 15th level.</p>\n \
\t<p><b>Saving Throws. </b>Some of your maneuvers require your target to make a saving throw to resist the maneuver's effects. The saving throw DC is calculated as follows:</p>\n \
\t<p><b>Maneuver save DC </b>= 8 + your proficiency bonus + your Strength or Dexterity modifier (your choice)</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Combat Superiority</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Battle Master</specialization>\n \
<source type=\"string\">Fighter</source>\n";

addFighterCommandersStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Commander's Strike;DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Commander's Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterDisarmingAttack=" \
<actions>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Disarming Strike; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00003>\n \
\t<id-00004>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Disarming Strike - item dropped;</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00004>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Disarming Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterDistractingStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Distracting Strike; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Distracting Strike; GRANTADVATK:</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Distracting Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterFeintingAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Feinting Attack; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Feinting Attack; ADVATK:</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Feinting Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterGoadingAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Goading Attack; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00003>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00003>\n \
\t<id-00004>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Goaded; DISATK:</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00004>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Goading Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterLungingAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Lunging Attack; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Lunging Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterManeuveringAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Maneuvering Attack; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Maneuvering Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterMenacingAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Menaced; frightened</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Menacing Attack; DMG: 1d8</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Menacing Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterPrecisionAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Precision Attack; ATK:1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Precision Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterPushingAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Pushing Attack; DMG: 1d8</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Pushing Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterRally=" \
<actions>\n \
\t<id-00002>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t\t<stat type=\"string\">charisma</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Rally</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterRiposte=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Riposte; DMG:1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Riposte</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterSweepingAttack=" \
<actions>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t\t<type type=\"string\">slashing</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t\t<type type=\"string\">piercing, magic</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Sweeping Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterTripAttack=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Trip Attack; prone</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Trip Attack; DMG:1d8</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Trip Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Fighter</source>\n";

addFighterEldritchStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Eldritch Strike; DISSAV:all;</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 10th level, you learn how to make your weapon strikes undercut a creature's resistance to your spells. When you hit a creature with a weapon attack, that creature has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Eldritch Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Eldritch Knight</specialization>\n \
<source type=\"string\">Fighter</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Fighter effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Monk effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addMonkUnarmedStrike = " \
\t\t\t\t<attackbonus type=\"number\">0</attackbonus>\n \
\t\t\t\t<attackstat type=\"string\">dexterity</attackstat>\n \
\t\t\t\t<carried type=\"number\">1</carried>\n \
\t\t\t\t<damagelist>\n \
\t\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d4</dice>\n \
\t\t\t\t<stat type=\"string\">base</stat>\n \
\t\t\t\t<statmult type=\"number\">1</statmult>\n \
\t\t\t\t<type type=\"string\">bludgeoning</type>\n \
\t\t\t\t</id-00001>\n \
\t\t\t\t</damagelist>\n \
\t\t\t\t<maxammo type=\"number\">0</maxammo>\n \
\t\t\t\t<name type=\"string\">Unarmed Strike</name>\n \
\t\t\t\t<prof type=\"number\">1</prof>\n \
\t\t\t\t<shortcut type=\"windowreference\">\n \
\t\t\t\t<class></class>\n \
\t\t\t\t<recordname></recordname>\n \
\t\t\t\t</shortcut>\n \
\t\t\t\t<type type=\"number\">0</type>\n";


addMonkEmptyBody=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Invisible</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">RESIST:all,!force</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 18th level, you can use your action to spend 4 ki points to become invisible for 1 minute.</p>\n \
\t<p>During that time, you also have resistance to all damage but force damage. Additionally, you can spend 8 ki points to cast the astral projection spell, without needing material components. When you do so, you can't take any other creatures with you.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Empty Body</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkEvasion=" \
<actions>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Evasion</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 7th level, your instinctive agility lets you dodge out of the way of certain area effects, such as a blue dragon's lightning breath or a fireball spell. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Evasion</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Monk</source>\n";

addMonkKi=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, your training allows you to harness the mystic energy of ki. Your access to this energy is represented by a number of ki points. Your monk level determines the number of points you have, as shown in the Ki Points column of the Monk table. You can spend these points to fuel various ki features. You start knowing three such features: Flurry of Blows, Patient Defense, and Step of the Wind. You learn more ki features as you gain levels in this class. When you spend a ki point, it is unavailable until you finish a short or long rest, at the end of which you draw all of your expended ki back into yourself. You must spend at least 30 minutes of the rest meditating to regain your ki points.</p>\n \
\t<p>Some of your ki features require your target to make a saving throw to resist the feature's effects. The saving throw DC is calculated as follows:</p>\n \
\t<p><b>Ki save DC </b>= 8 + your proficiency bonus + your Wisdom modifier</p>\n \
\t<p><b>Flurry of Blows</b></p>\n \
\t<p>Immediately after you take the Attack action on your turn, you can spend 1 ki point to make two unarmed strikes as a bonus action.</p>\n \
\t<p><b>Patient Defense</b></p>\n \
\t<p>You can spend 1 ki point to take the Dodge action as a bonus action on your turn.</p>\n \
\t<p><b>Step of the Wind</b></p>\n \
\t<p>You can spend 1 ki point to take the Disengage or Dash action as a bonus action on your turn, and your jump distance is doubled for the turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Ki</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkFlurryOfBlows=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">dexterity</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">prone</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Flurry of Blows</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkPatientDefense=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">dodge</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Patient Defense</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkStepOfTheWind=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Step of the Wind</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkPurityOfBody=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IMMUNE: poison,poisoned</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Immunity to disease</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 10th level, your mastery of the ki flowing through you makes you immune to disease and poison.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Purity of Body</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Monk</source>\n";

addMonkSlowFall=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00001>\n \
\t\t\t<id-00002>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00002>\n \
\t\t\t<id-00003>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00003>\n \
\t\t\t<id-00004>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00004>\n \
\t\t\t<id-00005>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00005>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 4th level, you can use your reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Slow Fall</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Monk</source>\n";

addMonkStunningStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">constitution</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Stunned</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 5th level, you can interfere with the flow of ki in an opponent's body. When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Stunning Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkWholenessOfBody=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">monk</stat>\n \
\t\t\t</id-00001>\n \
\t\t\t<id-00002>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">monk</stat>\n \
\t\t\t</id-00002>\n \
\t\t\t<id-00003>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">monk</stat>\n \
\t\t\t</id-00003>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 6th level, you gain the ability to heal yourself. As an action, you can regain hit points equal to three times your monk level. You must finish a long rest before you can use this feature again.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Wholeness of Body</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of the Open Hand</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkTranquility=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcbase type=\"string\">ability</savedcbase>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savedcstat type=\"string\">wisdom</savedcstat>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Tranquility</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 11th level, you can enter a special meditation that surrounds you with an aura of peace. At the end of a long rest, you gain the effect of a sanctuary spell that lasts until the start of your next long rest (the spell can end early as normal). The saving throw DC for the spell equals 8 + your Wisdom modifier + your proficiency bonus.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Tranquility</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of the Open Hand</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkShadowStep=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">ADVATK: melee</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 6th level, you gain the ability to step from one shadow into another. When you are in dim light or darkness, as a bonus action you can teleport up to 60 feet to an unoccupied space you can see that is also in dim light or darkness. You then have advantage on the first melee attack you make before the end of the turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Shadow Step</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of Shadow</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkCloakOfShadows=" \
<actions>\n \
\t<id-00001>\n \
\t\t<label type=\"string\">Invisible</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>By 11th level, you have learned to become one with the shadows. When you are in an area of dim light or darkness, you can use your action to become invisible. You remain invisible until you make an attack, cast a spell, or are in an area of bright light.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Cloak of Shadows</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of Shadow</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkFangsOfTheFireSnake=" \
<actions>\n \
\t<id-00001>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10</dice>\n \
\t\t\t\t<type type=\"string\">fire</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Fangs of the Fire Snake</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkFistOfUnbrokenAir=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<onmissdamage type=\"string\">half</onmissdamage>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10,d10,d10</dice>\n \
\t\t\t\t<type type=\"string\">bludgeoning</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10,d10,d10,d10</dice>\n \
\t\t\t\t<type type=\"string\">bludgeoning</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00003>\n \
\t<id-00004>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">prone</label>\n \
\t\t<order type=\"number\">4</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00004>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Fist of Unbroken Air</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkWaterWhip=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<onmissdamage type=\"string\">half</onmissdamage>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">dexterity</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10,d10,d10</dice>\n \
\t\t\t\t<type type=\"string\">bludgeoning</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">prone</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Water Whip</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkTouchOfDeath=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">wisdom</stat>\n \
\t\t\t</id-00001>\n \
\t\t\t<id-00002>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">monk</stat>\n \
\t\t\t</id-00002>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting when you choose this tradition at 3rd level, your study of death allows you to extract vitality from another creature as it nears its demise. When you reduce a creature within 5 feet of you to 0 hit points, you gain temporary hit points equal to your Wisdom modifier + your monk level (minimum of 1 temporary hit point).</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Touch of Death</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of the Long Death</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkHourOfReaping=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Frightened</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 6th level, you gain the ability to unsettle or terrify those around you as an action, for your soul has been touched by the shadow of death. When you take this action, each creature within 30 feet of you that can see you must succeed on a Wisdom saving throw or be frightened of you until the end of your next turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Hour of Reaping</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of the Long Death</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkTouchOfTheLongDeath=" \
<actions>\n \
\t<id-00001>\n \
\t\t<onmissdamage type=\"string\">half</onmissdamage>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">constitution</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10,d10</dice>\n \
\t\t\t\t<type type=\"string\">necrotic</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 17th level, your touch can channel the energy of death into a creature. As an action, you touch one creature within 5 feet of you, and you expend 1 to 10 ki points. The target must make a Constitution saving throw, and it takes 2d10 necrotic damage per ki point spent on a failed save, or half as much damage on a successful one.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Touch of the Long Death</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of the Long Death</specialization>\n \
<source type=\"string\">Monk</source>\n";

addMonkRadiantSunBolt=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkbase type=\"string\">ability</atkbase>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<atkstat type=\"string\">dexterity</atkstat>\n \
\t\t<atktype type=\"string\">ranged</atktype>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d4</dice>\n \
\t\t\t\t<stat type=\"string\">dexterity</stat>\n \
\t\t\t\t<type type=\"string\">radiant</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Radiant Sun Bolt</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Monk</source>\n";

addMonkSunShield=" \
<actions>\n \
\t<id-00001>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">5</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">wisdom</stat>\n \
\t\t\t\t<type type=\"string\">radiant</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 17th level, you become wreathed in a luminous aura. You shed bright light in a 30-foot radius and dim light for an additional 30 feet. You can extinguish or restore the light as a bonus action.</p>\n \
\t<p>If a creature hits you with a melee attack while this light shines, you can use your reaction to deal radiant damage to the creature. The radiant damage equals 5 + your Wisdom modifier.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Sun Shield</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Way of the Sun Soul</specialization>\n \
<source type=\"string\">Monk</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Monk effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Paladin effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */


addPaladinAuraOfCourage=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Aura of Courage; IMMUNE: frightened</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 10th level, you and friendly creatures within 10 feet of you can't be frightened while you are conscious.</p>\n \
\t<p>At 18th level, the range of this aura increases to 30 feet.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aura of Courage</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinAuraOfProtection=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Aura of Protection; SAVE: [CHA]</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier (with a minimum bonus of +1). You must be conscious to grant this bonus.</p>\n \
\t<p>At 18th level, the range of this aura increases to 30 feet.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aura of Protection</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinDivineHealth=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Divine Health - immune to disease;</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>By 3rd level, the divine magic flowing through you makes you immune to disease.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Divine Health</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinDivineSense=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>The presence of strong evil registers on your senses like a noxious odor, and powerful good rings like heavenly music in your ears. As an action, you can open your awareness to detect such forces. Until the end of your next turn, you know the location of any celestial, fiend, or undead within 60 feet of you that is not behind total cover. You know the type (celestial, fiend, or undead) of any being whose presence you sense, but not its identity (the vampire Count Strahd von Zarovich, for instance).</p>\n \
\t<p>Within the same radius, you also detect the presence of any place or object that has been consecrated or desecrated, as with the hallow spell.</p>\n \
\t<p>You can use this feature a number of times equal to 1 + your Charisma modifier. When you finish a long rest, you regain all expended uses.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Divine Sense</name>\n";

addPaladinDivineSense01=" \
<source type=\"string\">Paladin</source>\n";

addPaladinDivineSmite=" \
<actions>\n \
\t<id-00003>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DMG: 2d8 radiant; IFT: TYPE(fiend,undead);DMG:1d8 radiant</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
\t<id-00004>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DMG: 3d8 radiant; IFT: TYPE(fiend,undead);DMG:1d8 radiant</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00004>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, when you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon's damage. The extra damage is 2d8 for a 1st-level spell slot, plus 1d8 for each spell level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is an undead or a fiend.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Divine Smite</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinExaltedChampion=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">hour</durunit>\n \
\t\t<label type=\"string\">RESIST:bludgeoning,piercing,slashing,!magic;ADVSAV: wisdom; ADVDEATH</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 20th level, your presence on the field of battle is an inspiration to those dedicated to your cause. You can use your action to gain the following benefits for 1 hour:</p>\n \
\t<list>\n \
\t\t<li>You have resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.</li>\n \
\t\t<li>Your allies have advantage on death saving throws while within 30 feet of you.</li>\n \
\t\t<li>You have advantage on Wisdom saving throws, as do your allies within 30 feet of you.</li>\n \
\t</list>\n \
\t<p>This effect ends early if you are incapacitated or die. Once you use this feature, you can't use it again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Exalted Champion</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Paladin</source>\n \
<specialization type=\"string\">Oath of the Crown</specialization>\n";

addPaladinImprovedDivineSmite=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DMG: 1d8 radiant, melee</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>By 11th level, you are so suffused with righteous might that all your melee weapon strikes carry divine power with them. Whenever you hit a creature with a melee weapon, the creature takes an extra 1d8 radiant damage. If you also use your Divine Smite with an attack, you add this damage to the extra damage of your Divine Smite.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Improved Divine Smite</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinLayOnHands01=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">1</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">5</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">10</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your paladin level x5. As an action, you can touch a creature and draw power from the pool to restore a number of hit points to that creature, up to the maximum amount remaining in your pool.</p>\n \
\t<p>Alternatively, you can expend 5 hit points from your pool of healing to cure the target of one disease or neutralize one poison affecting it. You can cure multiple diseases and neutralize multiple poisons with a single use of Lay on Hands, expending hit points separately for each one.</p>\n \
\t<p>This feature has no effect on undead and constructs.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Lay on Hands</name>\n";
//<prepared type=\"number\">" + (levelPaladin * 5) + "</prepared>\n \
// Thanks Vex for recommending 1, 5 & 10 buttons
addPaladinLayOnHands02=" \
<source type=\"string\">Paladin</source>\n";

addPaladinChampionChallengeCrown=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you take this oath at 3rd level, you gain the following Channel Divinity options.</p>\n \
\t<p><b>Champion Challenge. </b>You issue a challenge that compels other creatures to do battle with you. Each creature of your choice that you can see within 30 feet of you must make a Wisdom saving throw. On a failed save, a creature can't willingly move more than 30 feet away from you. This effect ends on the creature if you are incapacitated or die or if the creature is moved more than 30 feet away from you.</p>\n \
\t<p><b>Turn the Tide. </b>As a bonus action, you can bolster injured creatures with your Channel Divinity. Each creature of your choice that can hear you within 30 feet of you regains hit points equal to 1d6 + your Charisma modifier (minimum of 1) if it has no more than half of its hit points.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Champion Challenge (Crown)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Oath of the Crown</specialization>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinTurnTheTideCrown=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d6</dice>\n \
\t\t\t\t<stat type=\"string\">charisma</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Turn the Tide (Crown)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinUnyieldingSpirit=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Oath of the Crown adv to save vs stunned or paralyzed;</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 15th level, you have advantage on saving throws to avoid becoming paralyzed or stunned.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Unyielding Spirit</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Oath of the Crown</specialization>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinSacredWeaponDevotion=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Sacred Weapon; ATK: [CHA];  DMGTYPE: magic</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Sacred Weapon (Devotion)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinTurnTheUnholyDevotion=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">turned</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Turn the Unholy (Devotion)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinAuraOfDevotion=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IMMUNE: charmed</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 7th level, you and friendly creatures within 10 feet of you can't be charmed while you are conscious. At 18th level, the range of this aura increases to 30 feet.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aura of Devotion</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Oath of Devotion</specialization>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinPurityOfSpirit=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IFT: TYPE(aberration,celestial,elemental,fey,fiend,undead);GRANTDISATK:</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IFT: TYPE(aberration,celestial,elemental,fey,fiend,undead); IMMUNE: charmed, frightened</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 15th level, you are always under the effects of a protection from evil and good spell.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Purity of Spirit</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Oath of Devotion</specialization>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinHolyNimbus=" \
<actions>\n \
\t<id-00001>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">10</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<type type=\"string\">radiant</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 20th level, as an action, you can emanate an aura of sunlight. For 1 minute, bright light shines from you in a 30-foot radius, and dim light shines 30 feet beyond that. Whenever an enemy creature starts its turn in the bright light, the creature takes 10 radiant damage.</p>\n \
\t<p>In addition, for the duration, you have advantage on saving throws against spells cast by fiends or undead. Once you use this feature, you can't use it again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Holy Nimbus</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Oath of Devotion</specialization>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinNaturesWrathAncients=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">dexterity</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">restrained</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p></p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">0</locked>\n \
<name type=\"string\">Nature's Wrath (Ancients)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinTurnTheFaithlessAncients=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">turned</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Turn the Faithless (Ancients)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinAuraOfWarding=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST: all</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 7th level, ancient magic lies so heavily upon you that it forms an eldritch ward. You and friendly creatures within 10 feet of you have resistance to damage from spells.</p>\n \
\t<p>At 18th level, the range of this aura increases to 30 feet.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Aura of Warding</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Oath of the Ancients</specialization>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinUndyingSentinal=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Undying Sentinel</name>\n \
<prepared type=\"number\">1</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinElderChampion=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Elder Champion; REGEN: 10</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DISSAV: all</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Elder Champion</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinAbjureEnemyVengeance=" \
<actions>\n \
\t<id-00001>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">frightened</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IF: TYPE(fiend,undead);DISSAV:</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group> <level type=\"number\">0</level>\n \
<name type=\"string\">Abjure Enemy (Vengeance)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinVowOfEnmityVengeance=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">ADVATK:</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<name type=\"string\">Vow of Enmity (Vengeance)</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Paladin</source>\n";

addPaladinAvengingAngel=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">frightened</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">GRANTADVATK:</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 20th level, you can assume the form of an angelic avenger. Using your action, you undergo a transformation. For 1 hour, you gain the following benefits:</p>\n \
\t<list>\n \
\t\t<li>Wings sprout from your back and grant you a flying speed of 60 feet.</li>\n \
\t\t<li>You emanate an aura of menace in a 30-foot radius. The first time any enemy creature enters the aura or starts its turn there during a battle, the creature must succeed on a Wisdom saving throw or become frightened of you for 1 minute or until it takes any damage. Attack rolls against the frightened creature have advantage.</li>\n \
\t</list>\n \
\t<p>Once you use this feature, you can't use it again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Avenging Angel</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Oath of Vengeance</specialization>\n \
<source type=\"string\">Paladin</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Paladin effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Ranger effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addRangerFavoredEnemy=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">ADVSKILL: survival</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">ADVCHK:intelligence</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 1st level, you have significant experience studying, tracking, hunting, and even talking to a certain type of enemy.</p>\n \
\t<p>Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead.</p>\n \
\t<p>Alternatively, you can select two races of humanoid (such as gnolls and orcs) as favored enemies.</p>\n \
\t<p>You have advantage on Wisdom(Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them.</p>\n \
\t<p>When you gain this feature, you also learn one language of your choice that is spoken by your favored enemies, if they speak one at all.</p>\n \
\t<p>You choose one additional favored enemy, as well as an associated language, at 6th and 14th level. As you gain levels, your choices should reflect the types of monsters you have encountered on your adventures.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Favored Enemy</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Ranger</source>\n";

addRangerFeralSenses=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IFT: invisible;ADVATK:</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 18th level, you gain preternatural senses that help you fight creatures you can't see. When you attack a creature you can't see, your inability to see it doesn't impose disadvantage on your attack rolls against it. You are also aware of the location of any invisible creature within 30 feet of you, provided that the creature isn't hidden from you and you aren't blinded or deafened.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Feral Senses</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Ranger</source>\n";

addRangerFoeSlayer=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">ATK:[WIS]</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IFT: TYPE(giant,orc); DMG:[WIS]</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 20th level, you become an unparalleled hunter of your enemies. Once on each of your turns, you can add your Wisdom modifier to the attack roll or the damage roll of an attack you make against one of your favored enemies. You can choose to use this feature before or after the roll, but before any effects of the roll are applied.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Foe Slayer</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Ranger</source>\n";

addRangerHideInPlainSight=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">SKILL: 10, stealth</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 10th level, you can spend 1 minute creating camouflage for yourself. You must have access to fresh mud, dirt, plants, soot, and other naturally occurring materials with which to create your camouflage.</p>\n \
\t<p>Once you are camouflaged in this way, you can try to hide by pressing yourself up against a solid surface, such as a tree or wall, that is at least as tall and wide as you are. You gain a +10 bonus to Dexterity (Stealth) checks as long as you remain there without moving or taking actions. Once you move or take an action or a reaction, you must camouflage yourself again to gain this benefit.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Hide in Plain Sight</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Ranger</source>\n";

addRangerLandsStride=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">ADVSAV:all</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 8th level, moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard. In addition, you have advantage on saving throws against plants that are magically created or manipulated to impede movement, such those created by the entangle spell.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Land's Stride</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Ranger</source>\n";

addRangerColossusSlayer=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IFT: Wounded; DMG: 1d8</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 3rd level, you gain one of the following features of your choice.</p>\n \
\t<p><b>Colossus Slayer. </b>Your tenacity can wear down the most potent foes. When you hit a creature with a weapon attack, the creature takes an extra 1d8 damage if it's below its hit point maximum. You can deal this extra damage only once per turn.</p>\n \
\t<p><b>Giant Killer. </b>When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack that creature immediately after its attack, provided that you can see the creature.</p>\n \
\t<p><b>Horde Breaker. </b>Once on each of your turns when you make a weapon attack, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target and within range of your weapon.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Colossus Slayer</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Hunter</specialization>\n \
<source type=\"string\">Ranger</source>\n";

addRangerDefensiveTactics=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">AC:4</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 7th level, you gain one of the following features of your choice.</p>\n \
\t<p><b>Escape the Horde. </b>Opportunity attacks against you are made with disadvantage.</p>\n \
\t<p><b>Multiattack Defense. </b>When a creature hits you with an attack, you gain a +4 bonus to AC against all subsequent attacks made by that creature for the rest of the turn.</p>\n \
\t<p><b>Steel Will. </b>You have advantage on saving throws against being frightened.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Defensive Tactics</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Hunter</specialization>\n \
<source type=\"string\">Ranger</source>\n";

addRangerSuperiorHuntersDefense=" \
<actions>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Evasion</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 15th level, you gain one of the following features of your choice.</p>\n \
\t<p><b>Evasion. </b>You can nimbly dodge out of the way of certain area effects, such as a red dragon's fiery breath or a lightning bolt spell. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.</p>\n \
\t<p><b>Stand Against the Tide. </b>When a hostile creature misses you with a melee attack, you can use your reaction to force that creature to repeat the same attack against another creature (other than itself) of your choice.</p>\n \
\t<p><b>Uncanny Dodge. </b>When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Superior Hunter's Defense</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Hunter</specialization>\n \
<source type=\"string\">Ranger</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Ranger effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Rogue effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addRogueEvasion=" \
<actions>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Evasion</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 7th level, you can nimbly dodge out of the way of certain area effects, such as a red dragon's fiery breath or an ice storm spell. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Evasion</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<source type=\"string\">Rogue</source>\n";

addRogueSneakAttack01=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n";

//\t\t<label type=\"string\">DMG: 10d6</label>\n \

addRogueSneakAttack02=" \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 1st level, you know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon.</p>\n \
\t<p>You don't need advantage on the attack roll if another enemy of the target is within 5 feet of it, that enemy isn't incapacitated, and you don't have disadvantage on the attack roll.</p>\n \
\t<p>The amount of the extra damage increases as you gain levels in this class, as shown in the Sneak Attack column of the Rogue table.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Sneak Attack</name>\n \
<prepared type=\"number\">0</prepared>\n \
<source type=\"string\">Rogue</source>\n";

addRogueRakishAudacity=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">INIT:[CHA]</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 3rd level, your unmistakable confidence propels you into battle. You can add your Charisma modifier to your initiative rolls.</p>\n \
\t<p>In addition, you don't need advantage on your attack roll to use your Sneak Attack if no creature other than your target is within 5 feet of you. All the other rules for the Sneak Attack class feature still apply to you.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Rakish Audacity</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Swashbuckler</specialization>\n \
<source type=\"string\">Rogue</source>\n";

addRoguePanache=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Charmed</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">GRANTDISATK:</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 9th level, your charm becomes extraordinarily beguiling. As an action, you can make a Charisma (Persuasion) check contested by a creature's Wisdom (Insight) check. The creature must be able to hear you, and the two of you must share a language.</p>\n \
\t<p>If you succeed on the check and the creature is hostile to you, it has disadvantage on attack rolls against targets other than you and can't make opportunity attacks against targets other than you. This effect lasts for 1 minute, until one of your companions attacks the target or affects it with a spell, or until you and the target are more than 60 feet apart.</p>\n \
\t<p>If you succeed on the check and the creature isn't hostile to you, it is charmed by you for 1 minute. While charmed, it regards you as a friendly acquaintance. This effect ends immediately if you or your companions do anything harmful to it.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Panache</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Swashbuckler</specialization>\n \
<source type=\"string\">Rogue</source>\n";

addRogueElegantManeuver=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">ADVSKILL: acrobatics; ADVSKILL: athletics</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 13th level, you can use a bonus action on your turn to gain advantage on the next Dexterity (Acrobatics) or Strength (Athletics) check you make during the same turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Elegant Maneuver</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Swashbuckler</specialization>\n \
<source type=\"string\">Rogue</source>\n";

addRogueDeathStrike=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">constitution</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 17th level, you become a master of instant death. When you attack and hit a creature that is surprised, it must make a Constitution saving throw (DC 8 + your Dexterity modifier + your proficiency bonus). On a failed save, double the damage of your attack against the creature.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Death Strike</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Assassin</specialization>\n \
<source type=\"string\">Rogue</source>\n";

addRogueMagicalAmbush=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">roll</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DISSAV: all;</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 9th level, if you are hidden from a creature when you cast a spell on it, the creature has disadvantage on any saving throw it makes against the spell this turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Magical Ambush</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Arcane Trickster</specialization>\n \
<source type=\"string\">Rogue</source>\n";

addRogueVersatileTrickster=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">ADVATK:</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 13th level, you gain the ability to distract targets with your mage hand. As a bonus action on your turn, you can designate a creature within 5 feet of the spectral hand created by the spell. Doing so gives you advantage on attack rolls against that creature until the end of the turn.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Versatile Trickster</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Arcane Trickster</specialization>\n \
<source type=\"string\">Rogue</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Rogue effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Sorcerer effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addSorcererFontOfMagic=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 2nd level, you tap into a deep wellspring of magic within yourself. This wellspring is represented by sorcery points, which allow you to create a variety of magical effects.</p>\n \
\t<p><b>Sorcery Points</b></p>\n \
\t<p>You have 2 sorcery points, and you gain more as you reach higher levels, as shown in the Sorcery Points column of the Sorcerer table. You can never have more sorcery points than shown on the table for your level. You regain all spent sorcery points when you finish a long rest.</p>\n \
\t<p><b>Flexible Casting</b></p>\n \
\t<p>You can use your sorcery points to gain additional spell slots, or sacrifice spell slots to gain additional sorcery points. You learn other ways to use your sorcery points as you reach higher levels. The created spell slots vanish at the end of a long rest.</p>\n \
\t<p><b>Creating Spell Slots. </b>You can transform unexpended sorcery points into one spell slot as a bonus action on your turn. The Creating Spell Slots table shows the cost of creating a spell slot of a given level. You can create spell slots no higher in level than 5th.</p>\n \
\t<p><b>Creating Spell Slots</b></p>\n \
\t<table>\n \
\t\t<tr>\n \
\t\t\t<td><b>Spell Slot Sorcery Level</b></td>\n \
\t\t\t<td><b>Point Cost</b></td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>1st</td>\n \
\t\t\t<td>2</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>2nd</td>\n \
\t\t\t<td>3</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>3rd</td>\n \
\t\t\t<td>5</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>4th</td>\n \
\t\t\t<td>6</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>5th</td>\n \
\t\t\t<td>7</td>\n \
\t\t</tr>\n \
\t</table>\n \
\t<p>Converting a Spell Slot to Sorcery Points. As a bonus action on your turn, you can expend one spell slot and gain a number of sorcery points equal to the slot's level.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Font of Magic</name>\n \
<prepared type=\"number\">20</prepared>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererHeartOfTheStorm=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST: lightning,thunder</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00005>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">10</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<type type=\"string\">lightning</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00005>\n \
\t<id-00006>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">10</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<type type=\"string\">thunder</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00006>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 6th level, you gain resistance to lightning and thunder damage. In addition, whenever you start casting a spell of 1st level or higher that deals lightning or thunder damage, stormy magic erupts from you. This eruption causes creatures of your choice that you can see within 10 feet of you to take lightning or thunder damage (choose each time this ability activates) equal to half your sorcerer level.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Heart of the Storm</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Storm Sorcery</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererStormsFury=" \
<actions>\n \
\t<id-00001>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t\t<type type=\"string\">lightning</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<atkmod type=\"number\">0</atkmod>\n \
\t\t<atkprof type=\"number\">1</atkprof>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<savedcmod type=\"number\">0</savedcmod>\n \
\t\t<savedcprof type=\"number\">1</savedcprof>\n \
\t\t<savetype type=\"string\">strength</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, when you are hit by a melee attack, you can use your reaction to deal lightning damage to the attacker. The damage equals your sorcerer level. The attacker must also make a Strength saving throw against your sorcerer spell save DC. On a failed save, the attacker is pushed in a straight line up to 20 feet away from you.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Storm's Fury</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Storm Sorcery</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererWindSoul=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IMMUNE:lightning,thunder</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 18th level, you gain immunity to lightning and thunder damage.</p>\n \
\t<p>You also gain a magical flying speed of 60 feet. As an action, you can reduce your flying speed to 30 feet for 1 hour and choose a number of creatures within 30 feet of you equal to 3 + your Charisma modifier. The chosen creatures gain a magical flying speed of 30 feet for 1 hour. Once you reduce your flying speed in this way, you can't do so again until you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Wind Soul</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Storm Sorcery</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererDragonAncestor=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">CHECK:[2PRF], charisma</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 1st level, you choose one type of dragon as your ancestor. The damage type associated with each dragon is used by features you gain later.</p>\n \
\t<p><b>Draconic Ancestry</b></p>\n \
\t<table>\n \
\t\t<tr>\n \
\t\t\t<td><b>Dragon</b></td>\n \
\t\t\t<td><b>Damage Type</b></td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Black</td>\n \
\t\t\t<td>Acid</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Blue</td>\n \
\t\t\t<td>Lightning</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Brass</td>\n \
\t\t\t<td>Fire</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Bronze</td>\n \
\t\t\t<td>Lightning</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Copper</td>\n \
\t\t\t<td>Acid</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Cold</td>\n \
\t\t\t<td>Fire</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Green</td>\n \
\t\t\t<td>Poison</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Red</td>\n \
\t\t\t<td>Fire</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>Silver</td>\n \
\t\t\t<td>Cold</td>\n \
\t\t</tr>\n \
\t\t<tr>\n \
\t\t\t<td>White</td>\n \
\t\t\t<td>Cold</td>\n \
\t\t</tr>\n \
\t</table>\n \
\t<p>You can speak, read, and write Draconic. Additionally, whenever you make a Charisma check when interacting with dragons, your proficiency bonus is doubled if it applies to the check.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Dragon Ancestor</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Draconic Bloodline</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererElementalAffinity=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">hour</durunit>\n \
\t\t<label type=\"string\">RESIST;fire</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">Affinity fire; DMG:[CHA]</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, when you cast a spell that deals damage of the type associated with your draconic ancestry, add your Charisma modifier to that damage. At the same time, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour. The damage bonus applies to one damage roll of a spell, not multiple rolls.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Elemental Affinity</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Draconic Bloodline</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererDraconicPresence=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Charmed</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 18th level, you can channel the dread presence of your dragon ancestor, causing those around you to become awestruck or frightened. As an action, you can spend 5 sorcery points to draw on this power and exude an aura of awe or fear (your choice) to a distance of 60 feet. For 1 minute or until you lose your concentration (as if you were casting a concentration spell), each hostile creature that starts its turn in this aura must succeed on a Wisdom saving throw or be charmed (if you chose awe) or frightened (if you chose fear) until the aura ends. A creature that succeeds on this saving throw is immune to your aura for 24 hours.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Draconic Presence</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">Draconic Bloodline</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

addSorcererTidesOfChaos=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">ADVATK; ADVCHK; ADVSAV</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 1st level, you can manipulate the forces of chance and chaos to gain advantage on one attack roll, ability check, or saving throw. Once you do so, you must finish a long rest before you can use this feature again. Any time before you regain the use of this feature, the DM can have you roll on the Wild Magic Surge table immediately after you cast a sorcerer spell of 1st level or higher. You then regain the use of this feature.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Tides of Chaos</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">Wild Magic</specialization>\n \
<source type=\"string\">Sorcerer</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Sorcerer effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Warlock effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addWarlockEldritchMaster=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 20th level, you can draw on your inner reserve of mystical power while entreating your patron to regain expended spell slots. You can spend 1 minute entreating your patron for aid to regain all your expended spell slots from your Pact Magic feature. Once you regain spell slots with this feature, you must finish a long rest before you can do so again.</p>\n \
</description>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Eldritch Master</name>\n \
<group type=\"string\">Class Features</group>\n \
<prepared type=\"number\">1</prepared>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockMysticArcanum=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 11th level, your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast your arcanum spell once without expending a spell slot. You must finish a long rest before you can do so again.</p>\n \
\t<p>At higher levels, you gain more warlock spells of your choice that can be cast in this way: one 7th-level spell at 13th level, one 8th-level spell at 15th level, and one 9th-level spell at 17th level. You regain all uses of your Mystic Arcanum when you finish a long rest.</p>\n \
</description>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Mystic Arcanum</name>\n \
<group type=\"string\">Class Features</group>\n \
<prepared type=\"number\">1</prepared>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockFeyPresence=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">charmed</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">frightened</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 1st level, your patron bestows upon you the ability to project the beguiling and fearsome presence of the fey. As an action, you can cause each creature in a 10-foot cube originating from you to make a Wisdom saving throw against your warlock spell save DC. The creatures that fail their saving throws are all charmed or frightened by you (your choice) until the end of your next turn. Once you use this feature, you can't use it again until you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Fey Presence</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Archfey</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockMistyEscape=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">invisible</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, you can vanish in a puff of mist in response to harm. When you take damage, you can use your reaction to turn invisible and teleport up to 60 feet to an unoccupied space you can see. You remain invisible until the start of your next turn or until you attack or cast a spell.</p>\n \
\t<p>Once you use this feature, you can't use it again until you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Misty Escape</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Archfey</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockBeguilingDefenses=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Charmed</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">IMMUNE:charmed</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 10th level, your patron teaches you how to turn the mind-affecting magic of your enemies against them. You are immune to being charmed, and when another creature attempts to charm you, you can use your reaction to attempt to turn the charm back on that creature. The creature must succeed on a Wisdom saving throw against your warlock spell save DC or be charmed by you for 1 minute or until the creature takes any damage.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Beguiling Defenses</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Archfey</specialization>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockDarkDelirium=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">Charmed</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">frightened</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, you can plunge a creature into an illusory realm. As an action, choose a creature that you can see within 60 feet of you. It must make a Wisdom saving throw against your warlock spell save DC. On a failed save, it is charmed or frightened by you (your choice) for 1 minute or until your concentration is broken (as if you are concentrating on a spell). This effect ends early if the creature takes any damage.</p>\n \
\t<p>Until this illusion ends, the creature thinks it is lost in a misty realm, the appearance of which you choose. The creature can see and hear only itself, you, and the illusion.</p>\n \
\t<p>You must finish a short or long rest before you can use this feature again.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Dark Delirium</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Archfey</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockDarkOnesBlessing=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">charisma</stat>\n \
\t\t\t</id-00001>\n \
\t\t\t<id-00002>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">warlock</stat>\n \
\t\t\t</id-00002>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 1st level, when you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Dark One's Blessing</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Fiend</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockFiendishResilience=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST:fire,!magic,!silver</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 10th level, you can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Fiendish Resilience</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Fiend</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockHurlThroughHell=" \
<actions>\n \
\t<id-00001>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d10,d10,d10,d10,d10,d10,d10,d10,d10,d10</dice>\n \
\t\t\t\t<type type=\"string\">psychic</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, when you hit a creature with an attack, you can use this feature to instantly transport the target through the lower planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, the target returns to the space it previously occupied, or the nearest unoccupied space. If the target is not a fiend, it takes 10d 10 psychic damage as it reels from its horrific experience. Once you use this feature, you can't use it again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Hurl Through Hell</name>\n \
<prepared type=\"number\">1</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Fiend</specialization>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockDarkOnesOwnLuck=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, you can call on your patron to alter fate in your favor. When you make an ability check or a saving throw, you can use this feature to add a d 10 to your roll. You can do so after seeing the initial roll but before any of the roll's effects occur.</p>\n \
\t<p>Once you use this feature, you can't use it again until you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Dark One's Own Luck</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">The Fiend</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockEntropicWard=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DISATK:</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">ADVATK:</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 6th level, you learn to magically ward yourself against attack and to turn an enemy's failed strike into good luck for yourself. When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on that roll. If the attack misses you, your next attack roll against the creature has advantage if you make it before the end of your next turn.</p>\n \
\t<p>Once you use this feature, you can't use it again until you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Entropic Ward</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">The Great Old One</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockThoughtShield=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST:psychic</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 10th level, your thoughts can't be read by telepathy or other m eans unless you allow it. You also have resistance to psychic damage, and whenever a creature deals psychic damage to you, that creature takes the same amount of damage that you do.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Thought Shield</name>\n \
<prepared type=\"number\">0</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">The Great Old One</specialization>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockCreateThrall=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">charmed</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 14th level, you gain the ability to infect a humanoid's mind with the alien magic of your patron. You can use your action to touch an incapacitated humanoid. That creature is then charmed by you until a remove curse spell is cast on it, the charmed condition is removed from it, or you use this feature again.</p>\n \
\t<p>You can communicate telepathically with the charmed creature as long as the two of you are on the same plane of existence.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Create Thrall</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">The Great Old One</specialization>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockAmongTheDead=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 1st level, you learn the spare the dying cantrip, which counts as a warlock cantrip for you. You also have advantage on saving throws against any disease.</p>\n \
\t<p>Additionally, undead have difficulty harming you. If an undead targets you directly with an attack or a harmful spell, that creature must make a Wisdom saving throw against your spell save DC (an undead needn't make the save when it includes you in an area effect, such as the explosion of fireball). On a failed save, the creature must choose a new target or forfeit targeting someone instead of you, potentially wasting the attack or spell. On a successful save, the creature is immune to this effect for 24 hours. An undead is also immune to this effect for 24 hours if you target it with an attack or a harmful spell.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Among the Dead</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">The Undying</specialization>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockDefyDeath=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t\t<stat type=\"string\">constitution</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, you can give yourself vitality when you cheat death or when you help someone else cheat it. You can regain hit points equal to 1d8 + your Constitution modifier (minimum of 1 hit point) when you succeed on a death saving throw or when you stabilize a creature with spare the dying.</p>\n \
\t<p>Once you use this feature, you can't use it again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Defy Death</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">The Undying</specialization>\n \
<source type=\"string\">Warlock</source>\n";

addWarlockIndestructibleLife=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d8</dice>\n \
\t\t\t\t<stat type=\"string\">warlock</stat>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>When you reach 14th level, you partake of some of the true secrets of the Undying. On your turn, you can use a bonus action to regain hit points equal to 1d8 + your warlock level. Additionally, if you put a severed body part of yours back in place when you use this feature, the part reattaches.</p>\n \
\t<p>Once you use this feature, you can't use it again until you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Indestructible Life</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">The Undying</specialization>\n \
<usesperiod type=\"string\">enc</usesperiod>\n \
<source type=\"string\">Warlock</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Warlock effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Wizard effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

addWizardArcaneRecovery=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.</p>\n \
\t<p>For example, if you're a 4th-level wizard, you can recover up to two levels worth of spell slots. You can recover either a 2nd-level spell slot or two 1st-level spell slots.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Arcane Recovery</name>\n \
<prepared type=\"number\">1</prepared>\n \
<source type=\"string\">Wizard</source>\n";

addWizardArcaneWard=" \
<actions>\n \
\t<id-00002>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00001>\n \
\t\t\t<id-00002>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">level</stat>\n \
\t\t\t</id-00002>\n \
\t\t\t<id-00003>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t\t<stat type=\"string\">intelligence</stat>\n \
\t\t\t</id-00003>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00002>\n \
\t<id-00004>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">2</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00004>\n \
\t<id-00005>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">4</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00005>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, you can weave magic around yourself for protection. When you cast an abjuration spell of 1st level or higher, you can simultaneously use a strand of the spell's magic to create a magical ward on yourself that lasts until you finish a long rest. The ward has hit points equal to twice your wizard level + your Intelligence modifier. Whenever you take damage, the ward takes the damage instead. If this damage reduces the ward to 0 hit points, you take any remaining damage.</p>\n \
\t<p>While the ward has 0 hit points, it can't absorb damage, but its magic remains. Whenever you cast an abjuration spell of 1st level or higher, the ward regains a number of hit points equal to twice the level of the spell. Once you create the ward, you can't create it again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Arcane Ward</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">School of Abjuration</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardImprovedAbjuration=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">CHECK:[PRF]</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 10th level, when you cast an abjuration spell that requires you to make an ability check as a part of casting that spell (as in counterspell and dispel magic), you add your proficiency bonus to that ability check.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Improved Abjuration</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Abjuration</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardSpellResistance=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST: all; ADVSAV: all</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, you have advantage on saving throws against spells. Furthermore, you have resistance against the damage of spells.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Spell Resistance</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Abjuration</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardBenignTransposition=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, you can use your action to teleport up to 30 feet to an unoccupied space that you can see.</p>\n \
\t<p>Alternatively, you can choose a space within range that is occupied by a Small or M edium creature. If that creature is willing, you both teleport, swapping places. Once you use this feature, you can't use it again until you finish a long rest or you cast a conjuration spell of 1st level or higher.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Benign Transposition</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">School of Conjuration</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardDurableSummons=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">30</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtype type=\"string\">temp</healtype>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, any creature that you summon or create with a conjuration spell has 30 temporary hit points.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Durable Summons</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Conjuration</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardPortent=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level when you choose this school, glimpses of the future begin to press in on your awareness. When you finish a long rest, roll two d20s and record the numbers rolled. You can replace any attack roll, saving throw, or ability check made by you or a creature that you can see with one of these foretelling rolls. You must choose to do so before the roll, and you can replace a roll in this way only once per turn. Each foretelling roll can be used only once. When you finish a long rest, you lose any unused foretelling rolls.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<level type=\"number\">0</level>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Portent</name>\n \
<prepared type=\"number\">2</prepared>\n \
<ritual type=\"number\">0</ritual>\n \
<specialization type=\"string\">School of Divination</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardHypnoticGaze=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Charmed</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
\t<id-00003>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<label type=\"string\">Incapacitated</label>\n \
\t\t<order type=\"number\">3</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00003>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level when you choose this school, your soft words and enchanting gaze can magically enthrall another creature. A s an action, choose one creature that you can see within 5 feet of you. If the target can see or hear you, it must succeed on a Wisdom saving throw against your wizard spell save DC or be charmed by you until the end of your next turn. The charmed creature's speed drops to 0, and the creature is incapacitated and visibly dazed.</p>\n \
\t<p>On subsequent turns, you can use your action to maintain this effect, extending its duration until the end of your next turn. However, the effect ends if you move more than 5 feet away from the creature, if the creature can neither see nor hear you, or if the creature takes damage.</p>\n \
\t<p>Once the effect ends, or if the creature succeeds on its initial saving throw against this effect, you can't use this feature on that creature again until you finish a long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Hypnotic Gaze</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Enchantment</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardInstinctiveCharm=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">wisdom</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 6th level, when a creature you can see within 30 feet of you makes an attack roll against you, you can use your reaction to divert the attack, provided that another creature is within the attack's range. The attacker must make a Wisdom saving throw against your wizard spell save DC. On a failed save, the attacker must target the creature that is closest to it, not including you or itself. If multiple creatures are closest, the attacker chooses which one to target. On a successful save, you can't use this feature on the attacker again until you finish a long rest.</p>\n \
\t<p>You must choose to use this feature before knowing whether the attack hits or misses. Creatures that can't be charmed are immune to this effect.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Instinctive Charm</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Enchantment</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardAlterMemories=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">intelligence</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 14th level, you gain the ability to make a creature unaware of your magical influence on it. When you cast an enchantment spell to charm one or more creatures, you can alter one creature's understanding so that it remains unaware of being charmed.</p>\n \
\t<p>Additionally, once before the spell expires, you can use your action to try to make the chosen creature forget some of the time it spent charmed. The creature must succeed on an Intelligence saving throw against your wizard spell save DC or lose a number of hours of its memories equal to 1 + your Charisma modifier (minimum 1). You can make the creature forget less time, and the amount of time can't exceed the duration of your enchantment spell.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Alter Memories</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Enchantment</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardEmpoweredEvocation=" \
<actions>\n \
\t<id-00001>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">DMG:[INT]</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 10th level, you can add your Intelligence modifier to the damage roll of any wizard evocation spell you cast. The damage bonus applies to one damage roll of a spell, not multiple rolls.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Empowered Evocation</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Evocation</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardOverchannel=" \
<actions>\n \
\t<id-00001>\n \
\t\t<damagelist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">0</bonus>\n \
\t\t\t\t<dice type=\"dice\">d12,d12</dice>\n \
\t\t\t\t<type type=\"string\">necrotic</type>\n \
\t\t\t</id-00001>\n \
\t\t</damagelist>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">damage</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, you can increase the power of your simpler spells. When you cast a wizard spell of 5th level or lower that deals damage, you can deal maximum damage with that spell.</p>\n \
\t<p>The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell, immediately after you cast it. Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12. This damage ignores resistance and immunity.</p>\n \
\t<p>The feature doesn't benefit cantrips.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Overchannel</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Evocation</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardIllusorySelf=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 10th level, you can create an illusory duplicate of yourself as an instant, almost instinctual reaction to danger. When a creature makes an attack roll against you, you can use your reaction to interpose the illusory duplicate between the attacker and yourself. The attack automatically misses you, then the illusion dissipates.</p>\n \
\t<p>Once you use this feature, you can't use it again until</p>\n \
\t<p>you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Illusory Self</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">School of Illusion</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardGrimHarvest=" \
<actions>\n \
\t<id-00001>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">2</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<heallist>\n \
\t\t\t<id-00001>\n \
\t\t\t\t<bonus type=\"number\">4</bonus>\n \
\t\t\t\t<dice type=\"dice\"></dice>\n \
\t\t\t</id-00001>\n \
\t\t</heallist>\n \
\t\t<healtargeting type=\"string\">self</healtargeting>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">heal</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 2nd level, you gain the ability to reap life energy from creatures you kill with your spells. Once per turn when you kill one or more creatures with a spell of 1st level or higher, you regain hit points equal to twice the spell's level, or three times its level if the spell belongs to the School of Necromancy. You don't gain this benefit for killing constructs or undead.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Grim Harvest</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Necromancy</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardInuredToDeath=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST:necrotic</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Beginning at 10th level, you have resistance to necrotic damage, and your hit point maximum can't be reduced. You have spent so much time dealing with undead and the forces that animate them that you have become inured to some of their worst effects.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Inured to Undeath</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Necromancy</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardCommandUndead=" \
<actions>\n \
\t<id-00001>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<savetype type=\"string\">charisma</savetype>\n \
\t\t<type type=\"string\">cast</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, you can use magic to bring undead under your control, even those created by other wizards. As an action, you can choose one undead that you can see within 60 feet of you. That creature must make a Charisma saving throw against your wizard spell save DC. If it succeeds, you can't use this feature on it again. If it fails, it becomes friendly to you and obeys your commands until you use this feature again. Intelligent undead are harder to control in this way. If the target has an Intelligence of 8 or higher, it has advantage on the saving throw. If it fails the saving throw and has an Intelligence of 12 or higher, it can repeat the saving throw at the end of every hour until it succeeds and breaks free.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Command Undead</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Necromancy</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardTransmutersStone=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">RESIST: acid</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">CON:[PRF]</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 6th level, you can spend 8 hours creating a transmuter's stone that stores transmutation magic. You can benefit from the stone yourself or give it to another creature. A creature gains a benefit of your choice as long as the stone is in the creature's possession. When you create the stone, choose the benefit from the following options:</p>\n \
\t<list>\n \
\t\t<li>Darkvision out to a range of 60 feet, as described in chapter 8</li>\n \
\t\t<li>An increase to speed of 10 feet while the creature is unencumbered</li>\n \
\t\t<li>Proficiency in Constitution saving throws</li>\n \
\t\t<li>Resistance to acid, cold, fire, lightning, or thunder damage (your choice whenever you choose this benefit)</li>\n \
\t</list>\n \
\t<p>Each time you cast a transmutation spell of 1st level or higher, you can change the effect of your stone if the stone is on your person.</p>\n \
\t<p>If you create a new transmuter's stone, the previous one ceases to function.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Transmuter's Stone</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">School of Transmutation</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardShapechanger=" \
<actions>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>At 10th level, you add the polymorph spell to your spellbook, if it is not there already. You can cast polymorph without expending a spell slot. When you do so, you can target only yourself and transform into a beast whose challenge rating is 1 or lower. Once you cast polymorph in this way, you can't do so again until you finish a short or long rest, though you can still cast it normally using an available spell slot.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Shapechanger</name>\n \
<prepared type=\"number\">1</prepared>\n \
<specialization type=\"string\">School of Transmutation</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardBladesong=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">AC:[INT];ADVSKILL:acrobatics</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
\t<id-00002>\n \
\t\t<apply type=\"string\">action</apply>\n \
\t\t<durmod type=\"number\">0</durmod>\n \
\t\t<label type=\"string\">SAVE:[INT],constitution</label>\n \
\t\t<order type=\"number\">2</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00002>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 2nd level, you can invoke a secret elven magic called the Bladesong, provided that you aren't wearing medium or heavy armor or using a shield. It graces you with supernatural speed, agility, and focus.</p>\n \
\t<p>You can use a bonus action to start the Bladesong, which lasts for 1 minute. It ends early if you are incapacitated, if you don medium or heavy armor or a shield, or if you use two hands to make an attack with a weapon. You can also dismiss the Bladesong at any time you choose (no action required).</p>\n \
\t<p>While your Bladesong is active, you gain the following benefits:</p>\n \
\t<list>\n \
\t\t<li>You gain a bonus to your AC equal to your Intelligence modifier (minimum of +1).</li>\n \
\t\t<li>Your walking speed increases by 10 feet.</li>\n \
\t\t<li>You have advantage on Dexterity (Acrobatics) checks.</li>\n \
\t\t<li>You gain a bonus to any Constitution saving throw you make to maintain your concentration on a spell. The bonus equals your Intelligence modifier (minimum of +1).</li>\n \
\t</list>\n \
\t<p>You can use this feature twice. You regain all expended uses of it when you finish a short or long rest.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Bladesong</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Bladesinging</specialization>\n \
<source type=\"string\">Wizard</source>\n";

addWizardSongOfVictory=" \
<actions>\n \
\t<id-00001>\n \
\t\t<durmod type=\"number\">1</durmod>\n \
\t\t<durunit type=\"string\">minute</durunit>\n \
\t\t<label type=\"string\">DMG:[INT],melee</label>\n \
\t\t<order type=\"number\">1</order>\n \
\t\t<targeting type=\"string\">self</targeting>\n \
\t\t<type type=\"string\">effect</type>\n \
\t</id-00001>\n \
</actions>\n \
<cast type=\"number\">0</cast>\n \
<description type=\"formattedtext\">\n \
\t<p>Starting at 14th level, you add your Intelligence modifier (minimum of +1) to the damage of your melee weapon attacks while your Bladesong is active.</p>\n \
</description>\n \
<group type=\"string\">Class Features</group>\n \
<locked type=\"number\">1</locked>\n \
<name type=\"string\">Song of Victory</name>\n \
<prepared type=\"number\">0</prepared>\n \
<specialization type=\"string\">Bladesinging</specialization> \
<source type=\"string\">Wizard</source>\n";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Wizard effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Start of Artificer effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */


/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

End of Artificer effects

* * * * * * * * * * * * * * * * * * * * * * * * * * */

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make all template variables globally accessible for browser environment
if (typeof window !== 'undefined') {
    // Racial trait templates
    window.addTiefHellResist = addTiefHellResist;
    
    // Barbarian templates
    window.addBarbarianRage = addBarbarianRage;
    window.addBarbarianDangerSense = addBarbarianDangerSense;
    window.addBarbarianWolfTotemSpirit = addBarbarianWolfTotemSpirit;
    window.addBarbarianEagleTotemSpirit = addBarbarianEagleTotemSpirit;
    window.addBarbarianBearTotemSpirit = addBarbarianBearTotemSpirit;
    window.addBarbarianWolfBeastAspect = addBarbarianWolfBeastAspect;
    window.addBarbarianEagleBeastAspect = addBarbarianEagleBeastAspect;
    window.addBarbarianBearBeastAspect = addBarbarianBearBeastAspect;
    window.addBarbarianRecklessAttack = addBarbarianRecklessAttack;
    window.addBarbarianFeralInstinct = addBarbarianFeralInstinct;
    window.addBarbarianBrutalCritical = addBarbarianBrutalCritical;
    window.addBarbarianRelentlessRage = addBarbarianRelentlessRage;
    window.addBarbarianTotemicAttunement = addBarbarianTotemicAttunement;
    window.addBarbarianMindlessRage = addBarbarianMindlessRage;
    window.addBarbarianIntimidatingPresence = addBarbarianIntimidatingPresence;
    
    // Bard templates
    window.addBardJackOfAllTrades = addBardJackOfAllTrades;
    window.addBardicInspiration = addBardicInspiration;
    window.addBardSongOfRest = addBardSongOfRest;
    window.addBardCountercharm = addBardCountercharm;
    
    // Cleric templates
    window.addClericTurnUndead = addClericTurnUndead;
    window.addClericArcaneAbjuration = addClericArcaneAbjuration;
    window.addClericCharmAnimals = addClericCharmAnimals;
    window.addClericPreserveLife = addClericPreserveLife;
    window.addClericBlessedHealer = addClericBlessedHealer;
    window.addClericCureWoundsSupreme = addClericCureWoundsSupreme;
    window.addClericCureWoundsLife = addClericCureWoundsLife;
    window.addClericWardingFlare = addClericWardingFlare;
    window.addClericRadianceOfDawn = addClericRadianceOfDawn;
    window.addClericCoronaOfLight = addClericCoronaOfLight;
    window.addClericDampenElements = addClericDampenElements;
    window.addClericDivineStrike = addClericDivineStrike;
    window.addClericWrathOfTheStorm = addClericWrathOfTheStorm;
    window.addClericBlessingOfTheTrickster = addClericBlessingOfTheTrickster;
    window.addClericCloakOfShadows = addClericCloakOfShadows;
    window.addClericWarPriest = addClericWarPriest;
    window.addClericAvatarOfBattle = addClericAvatarOfBattle;
    
    // Druid templates
    window.addDruidLandStride = addDruidLandStride;
    window.addDruidNaturalRecovery = addDruidNaturalRecovery;
    window.addDruidNaturesSanctuary = addDruidNaturesSanctuary;
    window.addDruidWildShape = addDruidWildShape;
    window.addDruidNaturesWard = addDruidNaturesWard;
    window.addDruidCombatWildShape = addDruidCombatWildShape;
    window.addDruidPrimalStrike = addDruidPrimalStrike;
    
    // Fighter templates
    window.addFighterActionSurge = addFighterActionSurge;
    window.addFighterIndomitable = addFighterIndomitable;
    window.addFighterSecondWind = addFighterSecondWind;
    window.addFighterRallyingCry = addFighterRallyingCry;
    window.addFighterRoyalEnvoy = addFighterRoyalEnvoy;
    window.addFighterRemarkableAthlete = addFighterRemarkableAthlete;
    window.addFighterSurvivor = addFighterSurvivor;
    window.addFighterCombatSuperiority = addFighterCombatSuperiority;
    window.addFighterCommandersStrike = addFighterCommandersStrike;
    window.addFighterDisarmingAttack = addFighterDisarmingAttack;
    window.addFighterDistractingStrike = addFighterDistractingStrike;
    window.addFighterFeintingAttack = addFighterFeintingAttack;
    window.addFighterGoadingAttack = addFighterGoadingAttack;
    window.addFighterLungingAttack = addFighterLungingAttack;
    window.addFighterManeuveringAttack = addFighterManeuveringAttack;
    window.addFighterMenacingAttack = addFighterMenacingAttack;
    window.addFighterPrecisionAttack = addFighterPrecisionAttack;
    window.addFighterPushingAttack = addFighterPushingAttack;
    window.addFighterRally = addFighterRally;
    window.addFighterRiposte = addFighterRiposte;
    window.addFighterSweepingAttack = addFighterSweepingAttack;
    window.addFighterTripAttack = addFighterTripAttack;
    window.addFighterEldritchStrike = addFighterEldritchStrike;
    
    // Monk templates
    window.addMonkUnarmedStrike = addMonkUnarmedStrike;
    window.addMonkEmptyBody = addMonkEmptyBody;
    window.addMonkEvasion = addMonkEvasion;
    window.addMonkKi = addMonkKi;
    window.addMonkFlurryOfBlows = addMonkFlurryOfBlows;
    window.addMonkPatientDefense = addMonkPatientDefense;
    window.addMonkStepOfTheWind = addMonkStepOfTheWind;
    window.addMonkPurityOfBody = addMonkPurityOfBody;
    window.addMonkSlowFall = addMonkSlowFall;
    window.addMonkStunningStrike = addMonkStunningStrike;
    window.addMonkWholenessOfBody = addMonkWholenessOfBody;
    window.addMonkTranquility = addMonkTranquility;
    window.addMonkShadowStep = addMonkShadowStep;
    window.addMonkCloakOfShadows = addMonkCloakOfShadows;
    window.addMonkFangsOfTheFireSnake = addMonkFangsOfTheFireSnake;
    window.addMonkFistOfUnbrokenAir = addMonkFistOfUnbrokenAir;
    window.addMonkWaterWhip = addMonkWaterWhip;
    window.addMonkTouchOfDeath = addMonkTouchOfDeath;
    window.addMonkHourOfReaping = addMonkHourOfReaping;
    window.addMonkTouchOfTheLongDeath = addMonkTouchOfTheLongDeath;
    window.addMonkRadiantSunBolt = addMonkRadiantSunBolt;
    window.addMonkSunShield = addMonkSunShield;
    
    // Paladin templates
    window.addPaladinAuraOfCourage = addPaladinAuraOfCourage;
    window.addPaladinAuraOfProtection = addPaladinAuraOfProtection;
    window.addPaladinDivineHealth = addPaladinDivineHealth;
    window.addPaladinDivineSense = addPaladinDivineSense;
    window.addPaladinDivineSmite = addPaladinDivineSmite;
    window.addPaladinExaltedChampion = addPaladinExaltedChampion;
    window.addPaladinImprovedDivineSmite = addPaladinImprovedDivineSmite;
    window.addPaladinChampionChallengeCrown = addPaladinChampionChallengeCrown;
    window.addPaladinTurnTheTideCrown = addPaladinTurnTheTideCrown;
    window.addPaladinUnyieldingSpirit = addPaladinUnyieldingSpirit;
    window.addPaladinSacredWeaponDevotion = addPaladinSacredWeaponDevotion;
    window.addPaladinTurnTheUnholyDevotion = addPaladinTurnTheUnholyDevotion;
    window.addPaladinAuraOfDevotion = addPaladinAuraOfDevotion;
    window.addPaladinPurityOfSpirit = addPaladinPurityOfSpirit;
    window.addPaladinHolyNimbus = addPaladinHolyNimbus;
    window.addPaladinNaturesWrathAncients = addPaladinNaturesWrathAncients;
    window.addPaladinTurnTheFaithlessAncients = addPaladinTurnTheFaithlessAncients;
    window.addPaladinAuraOfWarding = addPaladinAuraOfWarding;
    window.addPaladinUndyingSentinal = addPaladinUndyingSentinal;
    window.addPaladinElderChampion = addPaladinElderChampion;
    window.addPaladinAbjureEnemyVengeance = addPaladinAbjureEnemyVengeance;
    window.addPaladinVowOfEnmityVengeance = addPaladinVowOfEnmityVengeance;
    window.addPaladinAvengingAngel = addPaladinAvengingAngel;
    
    // Ranger templates
    window.addRangerFavoredEnemy = addRangerFavoredEnemy;
    window.addRangerFeralSenses = addRangerFeralSenses;
    window.addRangerFoeSlayer = addRangerFoeSlayer;
    window.addRangerHideInPlainSight = addRangerHideInPlainSight;
    window.addRangerLandsStride = addRangerLandsStride;
    window.addRangerColossusSlayer = addRangerColossusSlayer;
    window.addRangerDefensiveTactics = addRangerDefensiveTactics;
    window.addRangerSuperiorHuntersDefense = addRangerSuperiorHuntersDefense;
    
    // Rogue templates
    window.addRogueEvasion = addRogueEvasion;
    window.addRogueRakishAudacity = addRogueRakishAudacity;
    window.addRoguePanache = addRoguePanache;
    window.addRogueElegantManeuver = addRogueElegantManeuver;
    window.addRogueDeathStrike = addRogueDeathStrike;
    window.addRogueMagicalAmbush = addRogueMagicalAmbush;
    window.addRogueVersatileTrickster = addRogueVersatileTrickster;
    
    // Sorcerer templates
    window.addSorcererFontOfMagic = addSorcererFontOfMagic;
    window.addSorcererHeartOfTheStorm = addSorcererHeartOfTheStorm;
    window.addSorcererStormsFury = addSorcererStormsFury;
    window.addSorcererWindSoul = addSorcererWindSoul;
    window.addSorcererDragonAncestor = addSorcererDragonAncestor;
    window.addSorcererElementalAffinity = addSorcererElementalAffinity;
    window.addSorcererDraconicPresence = addSorcererDraconicPresence;
    window.addSorcererTidesOfChaos = addSorcererTidesOfChaos;
    
    // Warlock templates
    window.addWarlockEldritchMaster = addWarlockEldritchMaster;
    window.addWarlockMysticArcanum = addWarlockMysticArcanum;
    window.addWarlockFeyPresence = addWarlockFeyPresence;
    window.addWarlockMistyEscape = addWarlockMistyEscape;
    window.addWarlockBeguilingDefenses = addWarlockBeguilingDefenses;
    window.addWarlockDarkDelirium = addWarlockDarkDelirium;
    window.addWarlockDarkOnesBlessing = addWarlockDarkOnesBlessing;
    window.addWarlockFiendishResilience = addWarlockFiendishResilience;
    window.addWarlockHurlThroughHell = addWarlockHurlThroughHell;
    window.addWarlockDarkOnesOwnLuck = addWarlockDarkOnesOwnLuck;
    window.addWarlockEntropicWard = addWarlockEntropicWard;
    window.addWarlockThoughtShield = addWarlockThoughtShield;
    window.addWarlockCreateThrall = addWarlockCreateThrall;
    window.addWarlockAmongTheDead = addWarlockAmongTheDead;
    window.addWarlockDefyDeath = addWarlockDefyDeath;
    window.addWarlockIndestructibleLife = addWarlockIndestructibleLife;
    
    // Wizard templates
    window.addWizardArcaneRecovery = addWizardArcaneRecovery;
    window.addWizardArcaneWard = addWizardArcaneWard;
    window.addWizardImprovedAbjuration = addWizardImprovedAbjuration;
    window.addWizardSpellResistance = addWizardSpellResistance;
    window.addWizardBenignTransposition = addWizardBenignTransposition;
    window.addWizardDurableSummons = addWizardDurableSummons;
    window.addWizardPortent = addWizardPortent;
    window.addWizardHypnoticGaze = addWizardHypnoticGaze;
    window.addWizardInstinctiveCharm = addWizardInstinctiveCharm;
    window.addWizardAlterMemories = addWizardAlterMemories;
    window.addWizardEmpoweredEvocation = addWizardEmpoweredEvocation;
    window.addWizardOverchannel = addWizardOverchannel;
    window.addWizardIllusorySelf = addWizardIllusorySelf;
    window.addWizardGrimHarvest = addWizardGrimHarvest;
    window.addWizardInuredToDeath = addWizardInuredToDeath;
    window.addWizardCommandUndead = addWizardCommandUndead;
    window.addWizardTransmutersStone = addWizardTransmutersStone;
    window.addWizardShapechanger = addWizardShapechanger;
    window.addWizardBladesong = addWizardBladesong;
    window.addWizardSongOfVictory = addWizardSongOfVictory;
}