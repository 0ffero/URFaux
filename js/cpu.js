/*

Possible Moves:

Non Taking Moves:

Fall on AT5 - Highest Priority

Fall on a re-roll - Very High priority ─────────────────────┐
															│
Landing on FNA - Medium High Priority 						│
															│
Landing on starter spaces - Medium Priority 				├─────► THESE ARE TESTED FOR "THREAT" PRIORITY IF MORE THAN ONE COUNTER HAS THE SAME "MOVE" PRIORITY
															│
Landing on attack square 6 to 8 - Medium Low 				│
															│
First 4 ATTACK squares - Lowest Priority ───────────────────┘



Taking Moves:

Fall on a re-roll - Highest priority

First 4 ATTACK squares - High Priority

Landing on starter spaces - Medium Priority

Landing on attack square 6 to 8 - Medium Low

*/


BOARD OVERVIEW

[SA4][SA3][SA2][SA1][---][FNA][HA2][HA1]
[AT1][AT2][AT3][AT4][AT5][AT6][AT7][AT8]
[SB4][SB3][SB2][SB1][---][FNB][HB2][HB1]



EX 1: ST3 AT5 AT6 

ST3 - MEDIUM
AT5 - HIGHEST PRIORITY
AT6 - MEDIUM LOW


EX 2: SA4 AT5 HA2 FNA

SA4 - VERY HIGH PRIORITY
AT5 - HIGHEST PRIORITY
FNA - MEDIUM HIGH PRIORITY
HA2 - VERY HIGH PRIORITY


/*

FIGURE OUT THREAT LEVEL BASED ON HOW MANY COUNTERS CAN CURRENTLY TAKE A PIECE
AS WELL AS WHAT ITS THREAT LEVEL WILL DROP OR INCREASE TO BY MOVING

*/

IF NOT CURRENTLY ON AT5 (ANY COUNTER ON AT5 CAN NEVER BE TAKEN ie HAS NO THREAT ASSOCIATED WITH IT)
EX 1: THROW = 2
PLAYER A: AT5 AND AT6 <-- CURRENT POSITIONS
PLAYER B: AT3, AT4 AND AT7

SO THREAT PRIORITY FOR AT6 COUNTER IS 50% BY NOT MOVING (2 ENEMY COUNTERS CAN TAKE IF THE DICE ROLLS PERFECTLY FOR THEM - AT3 AND AT4)
BY MOVING (TO AT8), THE THREAT STAYS AT 50% AS AT4 AND AT7 CAN STILL TAKE YOU - BUT... AS SEEN EARLIER LANDING ON AT6 TO AT8 HAS MEDIUM TO LOW PRIORITY BUT IS PREFERABLE TO A LOW RELIABILITY MOVE
IN THIS CASE HOWEVER THE MOVE FROM AT5 TO AT7 (A TAKING MOVE) SHOULD HAVE PRIORITY