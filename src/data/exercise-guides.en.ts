export interface ExerciseGuide {
  summary: string
  steps: [string, string, string]
  focus: string
}

const guides: Record<string, ExerciseGuide> = {}

function add(ids: string[], summary: string, steps: [string, string, string], focus: string) {
  for (const id of ids) guides[id] = { summary, steps, focus }
}

add(['push_up'], 'A floor press using your body weight. Keep your body in one firm line from head to heels.', [
  'Set your hands just wider than your shoulders, fingers spread, and brace your abdomen and glutes.',
  'Bend your elbows and lower your chest between your hands while keeping your elbows angled slightly back.',
  'Press the floor away until your arms are straight, without letting your hips sag or your head reach forward.',
], 'Move your chest and hips together; stop the lowering range before your back arches.')
add(['incline_push_up'], 'A push-up with your hands raised on a stable surface, which makes each rep lighter.', [
  'Place your hands on a secure bench or counter, a little wider than shoulder width. Walk your feet back until your body is straight.',
  'Brace your middle and bend your elbows to bring your chest toward the edge of the support.',
  'Press through both hands to return to straight arms, keeping your body aligned.',
], 'Use a sturdy surface that cannot slide or tip.')
add(['knee_push_up'], 'A push-up variation that reduces the load by using your knees as the lower-body support.', [
  'Place your hands just wider than your shoulders and rest your knees on the floor. Keep a straight line from your head through your hips to your knees.',
  'Brace your abdomen and lower your chest toward the floor with your elbows angled slightly back.',
  'Press the floor away to straighten your arms while keeping your hips in line with your shoulders.',
], 'Keep your hips from folding back toward your heels.')
add(['decline_push_up'], 'A push-up with your feet raised; the raised position shifts more work toward your shoulders.', [
  'Set your feet on a stable, low surface and place your hands on the floor just outside shoulder width.',
  'Brace your body and lower your chest under control, keeping your hips level and your neck relaxed.',
  'Press back up until your arms are straight without letting your lower back sag.',
], 'Choose a foot height that lets you keep a steady body line.')
add(['diamond_push_up'], 'A close-hand push-up that places extra emphasis on the triceps.', [
  'Start in a push-up position and bring your hands close under your chest; let your thumbs and index fingers form a small diamond if comfortable.',
  'Keep your elbows close to your sides as you lower your chest toward your hands.',
  'Press the floor away and straighten your arms while keeping your trunk braced.',
], 'Widen your hands slightly if your wrists or shoulders feel strained.')
add(['archer_push_up'], 'A side-to-side push-up where one arm bends more while the other stays long.', [
  'Set your hands much wider than your shoulders with fingers turned slightly out; brace your body in a straight line.',
  'Shift your chest toward one hand and bend that elbow while keeping the opposite arm mostly straight.',
  'Push back to center, then repeat toward the other hand; count both sides as planned by your coach.',
], 'Keep both feet grounded and move only as far sideways as you can control.')
add(['pseudo_planche_push_up'], 'A push-up with your shoulders leaning ahead of your hands, increasing the demand on your shoulders and wrists.', [
  'Start in a high plank and turn your hands outward or slightly back only as far as your wrists comfortably allow.',
  'Lean your shoulders a little in front of your wrists, brace your body, and lower with your elbows close to your sides.',
  'Press up while maintaining the forward shoulder lean and a firm line through your hips.',
], 'Begin with a small lean; increase it gradually while keeping your wrists comfortable.')
add(['pike_push_up'], 'A push-up with your hips raised that emphasizes the shoulders.', [
  'Start on hands and feet with your hips high, legs comfortably bent, and head between your arms.',
  'Bend your elbows and lower the crown of your head toward the floor just in front of your hands.',
  'Press through your hands to lift your head and return to the hips-high position.',
], 'Keep your hips high so the movement stays focused on the shoulders.')
add(['elevated_pike_push_up'], 'A pike push-up with your feet raised, increasing the shoulder load.', [
  'Place your feet on a stable low platform and walk your hands in until your hips are high above your shoulders.',
  'Bend your elbows and lower your head between your hands with control.',
  'Press the floor away to return to the starting position without losing your hips-high shape.',
], 'Use a low, stable platform and shorten the range if you cannot keep control.')
add(['wall_handstand_push_up'], 'A vertical pressing exercise performed with your feet supported by a wall.', [
  'Set up in a stable wall-supported handstand, hands about shoulder width and fingers spread. Brace your abdomen.',
  'Bend your elbows and lower your head toward a padded, comfortable target between your hands.',
  'Press through your palms to straighten your arms and return to the supported handstand.',
], 'Only use a wall setup you can enter and leave safely; reduce the range if needed.')
add(['handstand_push_up'], 'A vertical body-weight press that requires balance and strong shoulder control.', [
  'Get into a stable handstand position with your hands shoulder width apart and fingers actively gripping the floor.',
  'Brace your body and bend your elbows to lower your head between your hands under control.',
  'Press through your palms until your elbows straighten and your body returns to the handstand line.',
], 'Practice against a wall or with an easier variation unless you can safely balance and exit.')
add(['ring_push_up'], 'A push-up using suspended rings, which move and require extra control.', [
  'Set the rings low and even. Grip them, step back into a straight-body plank, and keep them close to your sides.',
  'Lower your chest between the rings while keeping your shoulders steady and elbows angled back.',
  'Press the rings down and slightly inward to return to straight arms without letting them swing apart.',
], 'Adjust the ring height so you can keep the rings steady throughout each rep.')
add(['ring_dip'], 'A dip on suspended rings; the rings make balance and shoulder control especially important.', [
  'Hold the rings at your sides with straight arms and shoulders gently pressed down. Keep the rings close to your body.',
  'Bend your elbows and lower only through a comfortable shoulder range, keeping the rings from drifting outward.',
  'Press through the rings to straighten your arms and regain a steady support.',
], 'Use foot assistance or a shorter range if you cannot keep the rings stable.')
add(['dip'], 'A body-weight press between parallel bars.', [
  'Support yourself on the bars with straight arms, shoulders down, and legs relaxed or slightly bent.',
  'Bend your elbows and lower your body slowly, stopping before your shoulders feel pinched or uncomfortable.',
  'Press through the bars to return to straight arms without shrugging your shoulders.',
], 'Keep the range pain-free; use assistance if you cannot control the lowering phase.')
add(['bench_dip'], 'A triceps-focused dip with your hands on a stable bench behind you.', [
  'Sit at the edge of a secure bench and place your hands beside your hips. Move your hips just in front of the edge.',
  'Bend your elbows and lower a short distance while keeping your back close to the bench.',
  'Press through your palms to straighten your elbows and return to the top.',
], 'Keep the range shallow and shoulders comfortable; stop if the front of your shoulder pinches.')
add(['planche_lean'], 'A static body-weight hold that builds straight-arm shoulder strength.', [
  'Start on hands and knees or in a high plank, hands below your shoulders and elbows straight.',
  'Brace your body and slowly shift your shoulders forward past your wrists without bending your elbows.',
  'Hold the position while breathing steadily, then shift back to unload your wrists.',
], 'Use a small forward lean and stop before wrist or shoulder discomfort.')

add(['pull_up', 'chin_up', 'neutral_grip_pull_up'], 'A hanging pull that brings your upper body toward a bar.', [
  'Hang with a comfortable grip, arms long, legs still, and shoulders gently drawn down away from your ears.',
  'Pull your elbows toward your ribs and raise your chest until your chin reaches bar height.',
  'Lower slowly to a full comfortable hang without swinging into the next rep.',
], 'Avoid kicking or craning your neck to reach the bar.')
add(['assisted_pull_up'], 'A pull-up using a band or machine to reduce the amount of body weight you lift.', [
  'Set the assistance securely and choose a help level that lets you control the full movement.',
  'Begin from a long-arm hang with shoulders gently down, then pull your elbows toward your ribs.',
  'Lower slowly until your arms are long again, keeping the assistance setup stable.',
], 'Make sure the band or machine is correctly attached before you load it.')
add(['negative_pull_up'], 'A slow lowering practice for the pull-up.', [
  'Use a step or a safe jump to reach the top position with your chin above the bar.',
  'Brace your body and lower as slowly as you can, keeping your shoulders controlled.',
  'When your arms are long, step back up rather than jumping into the next negative.',
], 'Use a secure step and stop the set if you cannot control the descent.')
add(['archer_pull_up'], 'A side-biased pull-up that shifts more of the effort toward one arm.', [
  'Take a wide overhand grip and hang with your body still.',
  'Pull toward one hand, bending that elbow while keeping the other arm relatively straight.',
  'Lower to the hang with control and alternate sides on the next rep.',
], 'Keep the movement smooth and use a smaller side shift if your shoulders twist sharply.')
add(['typewriter_pull_up'], 'A pull-up followed by a controlled side-to-side shift at the top.', [
  'Take a wide overhand grip and pull your chest toward the bar.',
  'At the top, keep yourself raised and shift your chest toward one hand, then across toward the other.',
  'Lower under control to a hang before beginning the next rep.',
], 'Stay high only while your shoulders remain controlled; do not drop suddenly between sides.')
add(['muscle_up'], 'A powerful pull that transitions into a support above the bar or rings.', [
  'Start from a stable hang and create only the amount of swing your training calls for.',
  'Pull strongly toward the bar or rings, then bring your chest over your hands as your wrists turn above the support.',
  'Press to straight arms above the bar or rings, then return using a controlled path.',
], 'Practice the pull and transition separately until you can perform them without impact or shoulder pain.')
add(['sternum_pull_up'], 'A pull-up variation that brings the upper chest toward the bar.', [
  'Hang with an overhand grip and brace your trunk, keeping your legs still.',
  'Lean back slightly as you pull your elbows down and behind you, aiming your upper chest toward the bar.',
  'Lower slowly to a long-arm hang and reset your shoulders.',
], 'Use a range that lets you avoid swinging or forcing your shoulders back.')
add(['inverted_row', 'ring_row'], 'A horizontal pull with your body angled beneath a bar or rings.', [
  'Set a secure bar or rings around waist height. Hold the handles and lean back with your body straight and heels grounded.',
  'Pull your chest toward your hands by driving your elbows back and drawing your shoulder blades together.',
  'Lower your body slowly until your arms are straight, keeping your hips from sagging.',
], 'Move your feet forward to make it harder or back to make it easier.')
add(['archer_row'], 'A row that shifts your chest toward one hand while the opposite arm stays longer.', [
  'Set a low bar or rings, take a wide grip, and lean back with your body straight.',
  'Pull your chest toward one hand, bending that elbow as the other arm stays mostly straight.',
  'Lower with control and switch sides on the next repetition.',
], 'Keep your hips level and use a higher bar or more upright angle to reduce the load.')
add(['feet_elevated_row'], 'A horizontal row with your feet raised, making your body angle more challenging.', [
  'Set a secure bar or rings and place your heels on a stable support. Start with your body straight beneath the handles.',
  'Pull your chest toward your hands while keeping your ribs down and elbows moving back.',
  'Lower slowly until your arms are straight without dropping your hips.',
], 'Check that both the bar and foot support are secure before starting.')
add(['scapular_pull_up'], 'A small shoulder-blade movement performed while hanging with straight arms.', [
  'Hang from a secure bar with arms straight and your body quiet.',
  'Without bending your elbows, draw your shoulders down away from your ears so your body rises slightly.',
  'Relax back to the long-arm hang with control.',
], 'Keep the movement small; the elbows stay straight throughout.')
add(['active_hang'], 'A steady hang with your shoulders gently engaged.', [
  'Grip a secure bar and let your body hang with arms straight.',
  'Draw your shoulders gently down away from your ears while keeping your ribs and legs quiet.',
  'Hold for the planned time, then relax or step down safely.',
], 'Use a grip and duration that are comfortable for your hands and shoulders.')
add(['dead_hang'], 'A relaxed, straight-arm hang from a secure bar.', [
  'Grip the bar securely and let your arms lengthen as your feet leave the floor.',
  'Breathe normally and keep your body still rather than swinging.',
  'Step down or place your feet on a support before releasing your grip.',
], 'Do not drop from the bar when you finish.')
add(['tuck_front_lever'], 'A horizontal body hold from a bar or rings with your knees tucked.', [
  'Hang from a secure bar or rings, then draw your shoulders down and brace your abdomen.',
  'Tuck your knees toward your chest and lean back until your torso approaches horizontal.',
  'Hold without swinging, then return to the hang under control.',
], 'Shorten the hold or tuck more tightly if you cannot keep your body still.')
add(['front_lever_raise'], 'A controlled raise toward a horizontal body position while hanging.', [
  'Hang from a secure bar or rings with straight arms and shoulders engaged.',
  'Brace your body and lift your legs and torso together toward horizontal without kicking.',
  'Lower slowly to the hang while keeping the movement smooth.',
], 'Use a tucked variation if your lower back arches or you begin to swing.')
add(['skin_the_cat'], 'A controlled shoulder rotation through a tucked position on rings or a bar.', [
  'Hang from secure rings or a bar, tuck your knees, and keep your grip firm.',
  'Slowly lift your knees and rotate your legs through your arms only as far as your shoulders comfortably allow.',
  'Reverse the path with control and return to a hang; do not drop through the rotation.',
], 'Keep the range gentle and pain-free; skip this movement if your shoulders are not ready for deep rotation.')

add(['bodyweight_squat'], 'A basic squat that trains your legs while you lower and stand.', [
  'Stand with feet around shoulder width and toes turned slightly out; keep your whole foot on the floor.',
  'Send your hips back and down, bending your knees in line with your toes.',
  'Press the floor away to stand tall, keeping your chest and pelvis stacked.',
], 'Use the deepest range where your heels stay grounded and your knees feel comfortable.')
add(['goblet_squat', 'dumbbell_goblet_squat'], 'A squat while holding one weight close to your chest.', [
  'Hold a dumbbell or kettlebell close to your chest with feet around shoulder width.',
  'Brace your trunk and sit your hips down between your legs, keeping your whole foot planted.',
  'Push through the floor to stand while keeping the weight close to your body.',
], 'Keep your knees tracking in the same direction as your toes.')
add(['barbell_squat'], 'A loaded squat with a barbell resting securely across your upper back.', [
  'Set the bar on a rack around shoulder height and position it securely across your upper back; step clear of the rack.',
  'Brace, unlock your hips and knees together, and lower with your feet planted and knees following your toes.',
  'Drive through the floor to stand, then return the bar to the rack carefully.',
], 'Use safeties and a load you can control; ask a coach to check your rack setup if unsure.')
add(['split_squat', 'dumbbell_split_squat'], 'A stationary staggered-stance squat that works each leg separately.', [
  'Stand in a comfortable split stance with both feet pointing mostly forward and your torso upright.',
  'Lower straight down by bending both knees, keeping the front foot flat and front knee aligned with the toes.',
  'Press through the front foot to rise; complete the planned reps, then switch sides if needed.',
], 'Keep enough space between your feet so you feel balanced front to back.')
add(['reverse_lunge'], 'A lunge that steps backward, usually making it easier to stay balanced.', [
  'Stand tall with feet under your hips and brace your trunk.',
  'Step one foot back and lower until both knees bend comfortably, keeping most pressure through the front foot.',
  'Push through the front foot to return to standing, then alternate or finish the planned side.',
], 'Step back far enough to keep your front heel grounded.')
add(['forward_lunge'], 'A lunge that steps forward and lowers into a split stance.', [
  'Stand tall and take a controlled step forward, landing with the whole front foot.',
  'Bend both knees to lower your body while keeping your front knee aligned over your foot.',
  'Push through the front foot to step back to standing.',
], 'Use a shorter step if the front knee feels uncomfortable or your balance wavers.')
add(['cossack_squat'], 'A side-to-side squat that bends one leg while the other stays long.', [
  'Stand with a wide stance and toes turned slightly outward.',
  'Shift your hips toward one side, bending that knee while keeping the other leg long and its foot grounded.',
  'Press through the bent leg to return to center, then repeat on the other side.',
], 'Move only as deeply as your hips and ankles allow without forcing a stretch.')
add(['shrimp_squat'], 'A single-leg squat variation where the other leg bends behind you.', [
  'Stand on one leg and bend the other knee behind you; hold a support if needed.',
  'Bend the standing knee and lower under control while keeping that foot planted.',
  'Press through the standing foot to rise, then switch sides as planned.',
], 'Use a hand support or partial range to keep your balance and knee comfortable.')
add(['assisted_pistol_squat'], 'A one-leg squat supported by a handhold or strap for balance.', [
  'Hold a secure support and stand on one leg with the other leg reaching forward.',
  'Sit your hips back and lower on the standing leg, using your hands only as much as needed.',
  'Press through the whole foot to stand, then repeat on the other side.',
], 'Keep the standing knee tracking over the toes; use a box or shorter range if needed.')
add(['pistol_squat'], 'A deep single-leg squat with the free leg extended in front.', [
  'Balance on one foot with the other leg reaching forward and your arms extended for balance.',
  'Bend the standing knee and send your hips back as you lower, keeping the heel grounded.',
  'Press through the whole foot to return to standing without letting the knee collapse inward.',
], 'Use a box or hold a support if balance or depth limits a smooth rep.')
add(['sissy_squat'], 'A knee-dominant squat variation where the torso stays long as the knees travel forward.', [
  'Stand tall while holding a stable support if needed; keep your hips extended and trunk upright.',
  'Bend your knees and let them travel forward as your body leans back in one line.',
  'Straighten your knees to return to standing without folding at the hips.',
], 'Use a shallow range and support; stop if you feel knee pain.')
add(['nordic_curl'], 'A hamstring exercise that slowly lowers your body from a kneeling position.', [
  'Kneel on a pad and secure your ankles under a solid anchor or have a partner hold them.',
  'Keep your hips extended and body in a straight line as you lean forward slowly.',
  'Catch yourself with your hands, push lightly from the floor to return, and reset.',
], 'Use hand assistance and a short lowering range until you can control the descent.')
add(['glute_bridge'], 'A hip lift from the floor that uses your glutes to raise your pelvis.', [
  'Lie on your back with knees bent, feet flat about hip width, and arms relaxed by your sides.',
  'Brace gently and press through your feet to lift your hips until your body forms a line from shoulders to knees.',
  'Squeeze your glutes briefly, then lower your hips with control.',
], 'Finish by squeezing your glutes rather than arching your lower back.')
add(['single_leg_glute_bridge'], 'A floor hip lift performed with one foot supporting you.', [
  'Lie on your back with one knee bent and foot flat; lift the other leg so your thighs stay aligned.',
  'Press through the planted foot to raise your hips while keeping your pelvis level.',
  'Lower slowly, complete the planned reps, then switch legs.',
], 'Keep your hips level and use a smaller lift if your lower back arches.')
add(['hip_thrust', 'dumbbell_hip_thrust', 'barbell_hip_thrust'], 'A loaded or body-weight hip extension with your upper back supported.', [
  'Rest your upper back against a secure bench and place your feet flat about hip width; position any load securely across your hips.',
  'Brace your abdomen and drive through your feet to lift your hips until your torso is roughly level.',
  'Squeeze your glutes at the top, then lower your hips with control.',
], 'Keep your ribs down and avoid over-arching your lower back at the top.')
add(['calf_raise', 'dumbbell_calf_raise', 'machine_calf_raise'], 'A heel raise that trains the calf muscles.', [
  'Stand with feet hip width and hold a stable support or use the machine as directed; place your forefeet securely.',
  'Rise onto the balls of your feet as high as you can without rolling your ankles outward.',
  'Pause briefly, then lower your heels slowly to a comfortable stretch.',
], 'Move through a smooth range and avoid bouncing at the bottom.')
add(['single_leg_calf_raise'], 'A calf raise performed on one leg at a time.', [
  'Stand on one foot and hold a stable support for balance; keep the ankle straight.',
  'Rise onto the ball of that foot, lifting your heel as high as you can under control.',
  'Lower slowly, finish the planned reps, then switch feet.',
], 'Use a support so balance does not limit the calf movement.')
add(['hamstring_walkout'], 'A bridge hold with small heel steps that challenge the hamstrings.', [
  'Lie on your back with knees bent, feet flat, then lift your hips into a bridge.',
  'Take small alternating steps away from your body while keeping your hips raised.',
  'Walk your heels back in and lower your hips after the planned reps.',
], 'Keep the steps short enough that your hips do not drop sharply.')
add(['step_up'], 'A step onto a stable platform, driven by the leg on top.', [
  'Face a secure step and place one whole foot on top.',
  'Lean slightly forward and press through the foot on the step to stand up; bring the other foot up lightly.',
  'Step back down under control and repeat on the same leg or alternate as planned.',
], 'Choose a step height that lets you rise without pushing off hard from the floor leg.')
add(['wall_sit'], 'A static squat hold with your back supported by a wall.', [
  'Stand with your back against a clear wall and walk your feet forward.',
  'Slide down until your knees are comfortably bent and roughly over your ankles.',
  'Hold while breathing steadily and keeping your back in contact with the wall, then stand up carefully.',
], 'Choose a knee bend you can hold without pain or numbness.')
add(['squat_jump'], 'A squat followed by a controlled jump and soft landing.', [
  'Stand with feet around shoulder width, brace your trunk, and lower into a shallow squat.',
  'Swing your arms naturally and push through both feet to jump upward.',
  'Land softly on both feet with knees bent, absorb the landing, and reset before the next rep.',
], 'Use a low jump and stop if you cannot land quietly and under control.')
add(['reverse_nordic'], 'A kneeling quadriceps exercise where your body leans back as one line.', [
  'Kneel on a pad with knees about hip width and hips extended so your torso and thighs form one line.',
  'Brace your abdomen and lean your whole body back slowly, bending at the knees rather than the hips.',
  'Use your thighs to return upright under control.',
], 'Start with a small lean and stop at the first sign of knee discomfort.')
add(['deadlift'], 'A floor-to-stand lift that uses your hips and legs to move a barbell.', [
  'Stand with the bar over mid-foot. Hinge at your hips, bend your knees, and grip the bar just outside your legs.',
  'Brace your trunk, keep the bar close, and push the floor away as your hips and shoulders rise together.',
  'Stand tall without leaning back, then hinge and bend your knees to lower the bar close to your legs.',
], 'Keep the bar close and use a load that lets your back stay steady.')
add(['romanian_deadlift', 'dumbbell_rdl'], 'A hip hinge that lowers weights along your legs to stretch the hamstrings.', [
  'Stand tall holding the weights in front of your thighs, knees softly bent.',
  'Push your hips back and slide the weights close down your legs while keeping your back long.',
  'Stop when you feel a strong hamstring stretch, then drive your hips forward to stand.',
], 'This is a hip hinge, not a squat; keep the weights close to your body.')
add(['leg_press'], 'A machine squat pattern where you press a weighted platform away.', [
  'Sit into the machine with your back supported and feet around shoulder width on the platform.',
  'Release the safety handles, bend your knees, and lower the platform only as far as your hips stay supported.',
  'Press through your whole foot to extend your legs without locking your knees hard, then reset the safeties.',
], 'Check the machine stops and use a depth that keeps your lower back against the pad.')
add(['seated_leg_curl'], 'A machine exercise that bends your knees against resistance for the hamstrings.', [
  'Adjust the machine so its pivot aligns with your knee and the pad rests just above your heels.',
  'Hold the handles and curl your heels down and back under the seat.',
  'Return the pad slowly until your legs are nearly straight.',
], 'Use a comfortable range and avoid lifting your hips from the seat.')
add(['leg_extension'], 'A machine exercise that straightens your knees against resistance.', [
  'Sit with your back supported and align the machine pivot with your knee; set the pad above your ankles.',
  'Straighten your knees to raise the pad without kicking or lifting your hips.',
  'Lower the weight slowly until your knees are comfortably bent again.',
], 'Use a load and range that feel comfortable at the knees.')

add(['plank'], 'A forearm or hand support hold that trains your trunk to resist sagging.', [
  'Place your forearms or hands on the floor with elbows under shoulders; extend your legs behind you.',
  'Brace your abdomen and glutes so your head, hips, and heels form one line.',
  'Breathe steadily and hold the position, then lower your knees to finish.',
], 'Stop the hold when your hips sag or your lower back begins to arch.')
add(['side_plank'], 'A side support hold that trains the side of your trunk.', [
  'Lie on your side with your elbow beneath your shoulder and legs extended or knees bent for an easier version.',
  'Brace your side and lift your hips until your body forms a straight line.',
  'Hold while breathing normally, then lower with control and switch sides as planned.',
], 'Keep your shoulder away from your ear and your hips stacked.')
add(['hollow_hold'], 'A floor hold with your lower back gently pressed into the ground.', [
  'Lie on your back and gently press your lower back into the floor; lift your shoulders slightly.',
  'Raise your legs and reach your arms overhead only as far as your back stays down.',
  'Hold while breathing steadily, then bend your knees and relax to finish.',
], 'Bring your knees closer or arms forward if your lower back lifts.')
add(['arch_hold'], 'A face-down hold that strengthens the muscles along your back.', [
  'Lie face down with arms reaching overhead or by your sides and legs long.',
  'Gently lift your chest and thighs a small distance by tightening your back and glutes.',
  'Hold without straining your neck, then lower to the floor.',
], 'Keep your gaze toward the floor and use a small lift rather than cranking your back.')
add(['dead_bug'], 'A back-lying core exercise that moves opposite arm and leg while the trunk stays still.', [
  'Lie on your back, lift your legs with knees over hips, and reach your arms toward the ceiling.',
  'Brace your abdomen and slowly lower one arm and the opposite leg toward the floor.',
  'Return to center and alternate sides while keeping your lower back gently pressed down.',
], 'Shorten the reach if your lower back starts to lift.')
add(['hanging_knee_raise'], 'A hanging trunk exercise that lifts your knees toward your chest.', [
  'Hang from a secure bar with shoulders gently engaged and your legs still.',
  'Brace your abdomen and curl your knees upward toward your chest without swinging.',
  'Lower your legs slowly back to the hang and reset before the next rep.',
], 'Start the lift from your abdomen, not from a swing.')
add(['hanging_leg_raise'], 'A hanging exercise that raises your legs while your body stays controlled.', [
  'Hang from a secure bar with arms long and shoulders gently drawn down.',
  'Brace your trunk and raise your legs in front of you, keeping them as straight as your mobility allows.',
  'Lower slowly to a quiet hang without letting your body swing.',
], 'Bend your knees to make the movement easier and keep it controlled.')
add(['toes_to_bar'], 'A hanging raise that brings your toes toward the bar.', [
  'Hang securely with hands firm on the bar and shoulders engaged; keep the body still.',
  'Brace your trunk, lift your legs, and curl your hips until your toes reach toward the bar.',
  'Lower under control to a hang, reducing momentum before the next rep.',
], 'Use bent knees or a smaller leg raise if you cannot avoid swinging.')
add(['windshield_wiper'], 'A hanging core movement that rotates the legs from side to side.', [
  'Hang from a secure bar and raise your legs to a position you can control.',
  'Brace your trunk and rotate your legs a short distance to one side while keeping your shoulders steady.',
  'Return to center and rotate to the other side, then lower safely.',
], 'Use a bent-knee range and avoid forcing rotation through your lower back.')
add(['dragon_flag'], 'An advanced trunk hold and lowering movement using a bench or solid support.', [
  'Lie on a secure bench and grip its edge behind your head; raise your body so your shoulders support you.',
  'Keep your body long and braced as you lower it slowly from the shoulders, avoiding a lower-back arch.',
  'Stop at the lowest position you can control and return with assistance if needed.',
], 'This is advanced; use a tucked variation or another core exercise if control is not solid.')
add(['l_sit', 'l_sit_dip_bars'], 'A support hold with straight arms and legs lifted in front to form an L shape.', [
  'Support yourself on parallel bars, parallettes, or the floor with elbows straight and shoulders pushed down.',
  'Brace your abdomen and lift your legs in front, keeping your knees straight if possible.',
  'Hold while breathing steadily, then lower your feet under control.',
], 'Bend your knees or lift one leg at a time to scale the hold.')
add(['v_sit'], 'A seated balance hold with your torso and legs lifted toward a V shape.', [
  'Sit on the floor with legs together and hands beside your hips for balance.',
  'Brace your abdomen, lean back slightly, and lift your legs while reaching your hands forward.',
  'Hold a shape you can keep without rounding sharply, then lower your feet.',
], 'Bend your knees to make the hold easier and keep breathing.')
add(['mountain_climber'], 'A moving plank where you alternate bringing one knee toward your chest.', [
  'Start in a high plank with hands under shoulders and your body in a straight line.',
  'Bring one knee toward your chest while keeping your hips relatively level.',
  'Return that foot and switch legs smoothly for the planned time or reps.',
], 'Move at a pace that lets you keep your shoulders over your hands and trunk braced.')
add(['bear_crawl'], 'A low crawl on hands and feet with your knees hovering above the floor.', [
  'Start on hands and knees, then lift your knees a few centimeters while keeping your back flat.',
  'Move the opposite hand and foot forward a short distance, keeping hips low and steady.',
  'Continue alternating steps, then reverse or stop as planned.',
], 'Take small quiet steps and keep your knees close to the floor.')
add(['bird_dog'], 'A hands-and-knees balance exercise extending opposite arm and leg.', [
  'Start on hands and knees with hands under shoulders and knees under hips.',
  'Brace gently and reach one arm forward as you extend the opposite leg behind you.',
  'Return to the start without shifting your trunk, then switch sides.',
], 'Keep your pelvis level; the goal is a steady trunk, not a high leg lift.')
add(['bicycle_crunch'], 'A back-lying alternating trunk curl with a pedaling leg motion.', [
  'Lie on your back with hands lightly supporting your head and knees lifted.',
  'Curl one shoulder toward the opposite knee as the other leg extends away.',
  'Switch sides in a smooth pedaling action without pulling on your neck.',
], 'Keep your lower back gently down and move slowly enough to avoid swinging.')
add(['reverse_crunch'], 'A small abdominal curl that lifts your pelvis off the floor.', [
  'Lie on your back with knees bent and thighs above your hips; rest your arms by your sides.',
  'Brace your abdomen and curl your knees toward your chest, lifting your tailbone slightly.',
  'Lower your pelvis and feet slowly back to the starting position.',
], 'Keep the curl small and avoid swinging your legs for momentum.')
add(['russian_twist'], 'A seated trunk rotation from side to side.', [
  'Sit with knees bent and feet on the floor; lean back slightly while keeping your chest open.',
  'Brace your trunk and rotate your shoulders to one side, moving your hands with your chest.',
  'Return through center and rotate to the other side under control.',
], 'Keep the rotation in your upper trunk and use a smaller range if your back feels strained.')
add(['scapular_push_up'], 'A small shoulder-blade movement performed in a straight-arm plank.', [
  'Start in a high plank with hands under shoulders and elbows straight.',
  'Let your chest sink slightly between your shoulders, then push the floor away to spread your shoulder blades.',
  'Repeat the small motion while keeping your elbows locked and trunk steady.',
], 'Keep the elbows straight; this is a shoulder-blade glide, not a full push-up.')
add(['ring_support_hold'], 'A straight-arm support hold above suspended rings.', [
  'Set the rings securely and hold them at your sides with arms straight.',
  'Press down through the rings, keep your shoulders away from your ears, and steady the straps.',
  'Hold for the planned time, then lower your feet or step down safely.',
], 'Use foot assistance or lower rings if you cannot keep them close and steady.')
add(['shoulder_tap'], 'A plank variation alternating a hand tap to the opposite shoulder.', [
  'Start in a high plank with feet slightly wider than your hips for balance.',
  'Shift your weight gently and tap one hand to the opposite shoulder without rotating your hips much.',
  'Place the hand down and alternate sides while keeping your body braced.',
], 'Widen your feet or slow down if your hips rock side to side.')

add(['shoulder_dislocate'], 'A shoulder mobility drill moving a light stick or band overhead and behind you.', [
  'Hold a stick or light band with a wide grip in front of your thighs, arms relaxed and elbows straight.',
  'Raise it slowly overhead and continue behind your head only as far as your shoulders move comfortably.',
  'Reverse the path to bring it back in front, keeping the movement smooth.',
], 'Keep the grip wide and never force a painful shoulder stretch.')
add(['worlds_greatest_stretch'], 'A lunge and rotation sequence that opens the hips and upper back.', [
  'Step into a long lunge and place both hands inside the front foot, with the back leg extended.',
  'Lower your hips gently, then rotate your chest toward the front leg and reach one arm upward.',
  'Return the hand to the floor and step back; repeat on the other side.',
], 'Move slowly and keep the front knee tracking over the foot.')
add(['deep_squat_hold'], 'A supported or unsupported deep squat held as a mobility position.', [
  'Stand with feet a little wider than your hips and toes turned slightly out.',
  'Lower into a squat and let your hips sink between your legs while keeping your heels grounded if possible.',
  'Hold comfortably, using a post or door frame for balance, then stand up slowly.',
], 'Use support or a raised heel if needed; do not force your knees or ankles into a painful range.')
add(['hip_flexor_stretch'], 'A half-kneeling stretch for the front of the hip.', [
  'Kneel on a pad with one foot in front so both knees are bent around a right angle.',
  'Gently tuck your pelvis and squeeze the glute of the kneeling leg, then shift your hips forward a little.',
  'Hold the stretch at the front of the hip while breathing, then switch sides.',
], 'Keep your ribs stacked over your pelvis instead of arching your back.')
add(['wrist_prep'], 'A gentle warm-up moving your wrists through comfortable ranges.', [
  'Place your hands on a wall or floor with fingers spread; start with light pressure.',
  'Shift your body gently forward and back, then turn your hands to explore a comfortable wrist angle.',
  'Ease off and circle or shake out your wrists between short rounds.',
], 'Keep pressure mild and stop if you feel sharp pain, tingling, or numbness.')

add(['dumbbell_bench_press', 'barbell_bench_press'], 'A chest press performed lying on a bench.', [
  'Lie with your feet planted and shoulder blades gently drawn back against the bench; hold the weights above your chest.',
  'Lower the weights toward the sides of your chest with wrists stacked over elbows.',
  'Press upward until your arms are nearly straight, keeping your shoulders settled on the bench.',
], 'Use a spotter or safety arms for a barbell, and keep the load controlled.')
add(['dumbbell_incline_press'], 'A chest press on a gently inclined bench.', [
  'Set the bench to a modest incline, plant your feet, and hold dumbbells beside your upper chest.',
  'Keep your wrists over your elbows and press the weights upward in a slight arc.',
  'Lower slowly until the dumbbells are beside your upper chest again.',
], 'Keep your shoulders down against the bench and avoid an excessively steep incline.')
add(['dumbbell_overhead_press', 'overhead_press'], 'A standing or seated press that raises weights overhead.', [
  'Hold the weights at shoulder height with wrists above elbows; brace your abdomen and keep your ribs down.',
  'Press upward until your arms are straight and the weights finish over your shoulders.',
  'Lower slowly to shoulder height without leaning your lower back backward.',
], 'Use a load that lets you keep your ribs stacked over your hips.')
add(['dumbbell_lateral_raise', 'cable_lateral_raise'], 'A shoulder raise moving the arms out to the sides.', [
  'Stand tall with a light dumbbell or cable handle by your side and a soft bend in your elbow.',
  'Raise your arm out to the side to about shoulder height, leading with the elbow.',
  'Lower slowly back to your side without swinging your torso.',
], 'Use a light load and stop around shoulder height if that is comfortable.')
add(['dumbbell_chest_fly', 'cable_chest_fly'], 'A chest movement that brings slightly bent arms together in front of you.', [
  'Set up on a bench or between cables with arms open and elbows softly bent.',
  'Bring your hands together in front of your chest in a wide hugging arc.',
  'Open your arms slowly until you feel a comfortable chest stretch, keeping the elbow bend steady.',
], 'Use a light load and avoid letting your elbows travel far behind your body.')
add(['cable_tricep_pushdown'], 'A cable exercise that straightens your elbows to train the triceps.', [
  'Face the cable and hold the handle with elbows tucked beside your ribs.',
  'Straighten your elbows to press the handle down while keeping your upper arms still.',
  'Let your forearms rise slowly until your elbows bend comfortably again.',
], 'Keep your shoulders relaxed and do not rock your torso to move the weight.')
add(['chest_press_machine'], 'A seated machine press for the chest and arms.', [
  'Adjust the seat so the handles line up around mid-chest; keep your back supported and feet grounded.',
  'Press the handles forward until your arms are nearly straight.',
  'Return the handles slowly until your elbows are just behind or level with your torso, within a comfortable range.',
], 'Set the machine stops and seat before adding weight.')
add(['dumbbell_row'], 'A one-arm pull that draws a dumbbell toward your hip.', [
  'Support one hand on a bench and place your feet securely, keeping your back long and nearly level.',
  'Pull the dumbbell toward your hip with your elbow close to your body.',
  'Lower it slowly until your arm is long, then complete the planned side and switch.',
], 'Keep your shoulders and hips square to the floor instead of twisting to lift.')
add(['renegade_row'], 'A plank row that alternates pulling a dumbbell while resisting trunk rotation.', [
  'Set two stable dumbbells under your shoulders and hold a high plank with feet wider than hip width.',
  'Brace your trunk and row one dumbbell toward your ribs while keeping your hips square.',
  'Set it down quietly and repeat with the other arm.',
], 'Use light weights or perform from your knees if you cannot keep your hips steady.')
add(['dumbbell_reverse_fly'], 'A bent-over raise that moves dumbbells out to the sides for the upper back.', [
  'Hold light dumbbells and hinge at your hips with a long back and softly bent elbows.',
  'Raise your arms out to the sides until they are near shoulder height, squeezing your shoulder blades gently.',
  'Lower slowly to the starting position without swinging.',
], 'Keep your neck relaxed and use a lighter weight if you have to jerk the dumbbells.')
add(['dumbbell_curl'], 'An elbow curl with your palms facing forward or turning upward.', [
  'Stand tall holding dumbbells by your sides, elbows close to your body.',
  'Bend your elbows to curl the weights toward your shoulders without moving your upper arms much.',
  'Lower the dumbbells slowly until your arms are nearly straight.',
], 'Keep your torso still rather than leaning back to lift the weights.')
add(['hammer_curl'], 'An elbow curl with palms facing each other, like holding a pair of hammers.', [
  'Stand tall with dumbbells by your sides and palms facing inward.',
  'Bend your elbows and bring the weights toward your shoulders while keeping your wrists neutral.',
  'Lower slowly to straight arms without swinging.',
], 'Keep your elbows close to your sides throughout the curl.')
add(['barbell_row'], 'A bent-over barbell pull toward your lower ribs.', [
  'Stand with the bar over mid-foot, hinge your hips back, and hold the bar just outside your legs.',
  'Brace your trunk and pull the bar toward your lower ribs while keeping your back long.',
  'Lower the bar slowly until your arms are straight, maintaining the hip hinge.',
], 'Choose a load that lets your torso stay steady rather than jerking upright.')
add(['lat_pulldown'], 'A seated cable pull that brings a bar from overhead toward your upper chest.', [
  'Set the thigh pad snugly and take a comfortable overhand grip wider than your shoulders.',
  'Draw your shoulders down, then pull the bar toward your upper chest by driving elbows down.',
  'Let the bar rise slowly until your arms are long, without shrugging suddenly.',
], 'Pull in front of your head and avoid leaning far backward.')
add(['seated_cable_row'], 'A seated cable pull that brings the handle toward your torso.', [
  'Sit tall with knees soft and hold the handle with arms extended; brace your trunk.',
  'Pull the handle toward your lower ribs, leading with your elbows and keeping shoulders down.',
  'Reach forward slowly until your arms are long without rounding sharply through your back.',
], 'Keep your torso mostly still; do not rock backward to move the cable.')
add(['cable_face_pull'], 'A cable pull toward your face that trains the rear shoulders and upper back.', [
  'Set the cable around face height and hold the rope with thumbs pointing behind you.',
  'Pull the rope toward your forehead while your elbows move out and back.',
  'Return your hands forward slowly, keeping your shoulders relaxed.',
], 'Use a light load and keep your ribs from flaring as you pull.')

add(['treadmill_run'], 'A steady run on a moving treadmill belt.', [
  'Step onto the side rails, attach the safety clip, and start the belt at a walking pace.',
  'Build up to your planned running speed gradually, looking ahead and landing naturally beneath you.',
  'Slow the belt before stepping onto the rails to finish.',
], 'Use the safety clip and keep clear of the moving belt when stepping on or off.')
add(['treadmill_walk'], 'A walk on a moving treadmill belt.', [
  'Step onto the side rails, start the belt slowly, then step onto the belt when it is moving steadily.',
  'Walk upright with a natural stride and use the handrails only for balance if needed.',
  'Reduce the speed gradually and step back onto the rails before stopping.',
], 'Keep the safety clip attached and do not jump onto or off a moving belt.')
add(['stationary_bike'], 'A seated cycling effort on a stationary bike.', [
  'Adjust the seat so your knee remains slightly bent when the pedal is at its lowest point.',
  'Place the balls of your feet on the pedals and cycle smoothly at the planned resistance.',
  'Slow your cadence before stepping off the bike.',
], 'If your hips rock from side to side, adjust the seat or reduce the reach.')
add(['rowing_machine'], 'A full-body cardio stroke using a rowing machine.', [
  'Secure your feet and sit tall with knees bent, arms reaching forward to the handle.',
  'Push with your legs first, then lean back slightly and draw the handle toward your lower ribs.',
  'Recover in reverse order: arms forward, torso forward, then bend your knees to slide in.',
], 'Keep the handle path level and avoid rounding your back as you reach forward.')
add(['elliptical'], 'A smooth stepping motion on an elliptical trainer.', [
  'Step onto the pedals while holding the fixed handles, then select an easy resistance.',
  'Stand tall, keep your knees soft, and move the pedals in a smooth oval path.',
  'Slow the pedals to a stop before stepping off.',
], 'Keep your feet flat on the pedals and use the moving handles only if comfortable.')
add(['stair_climber'], 'A continuous step-up effort on a stair-climbing machine.', [
  'Step onto the machine carefully and start at a low pace, holding the rails for balance.',
  'Step onto each moving stair with your whole foot and keep your torso upright.',
  'Slow the machine to a stop before stepping off.',
], 'Use the rails for balance rather than supporting your full body weight on them.')

export function exerciseGuideFor(id: string): ExerciseGuide | undefined {
  return guides[id]
}
