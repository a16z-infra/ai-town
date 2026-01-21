"""
═══════════════════════════════════════════════════════════════════════════════
RALPH TOWN CHARACTER BUILDER
Creates all X402 World character models in Blender
Run this script after ralph_town_materials.py
═══════════════════════════════════════════════════════════════════════════════
"""

import bpy
import math
from mathutils import Vector


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_material(name):
    """Get a material by name from the library"""
    return bpy.data.materials.get(name)


def create_empty_parent(name, location=(0, 0, 0)):
    """Create an empty object to parent character parts"""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=location)
    empty = bpy.context.active_object
    empty.name = name
    return empty


def apply_material(obj, material_name):
    """Apply a material to an object"""
    mat = get_material(material_name)
    if mat:
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)


# ═══════════════════════════════════════════════════════════════════════════════
# THE ORACLE - Chief Orchestrator
# Robed figure with multiple floating crystals forming a crown
# ═══════════════════════════════════════════════════════════════════════════════

def create_oracle(location=(0, 0, 0)):
    """Create The Oracle character - the Chief Orchestrator"""

    parent = create_empty_parent("Oracle", location)

    # Body - cone shape for robed figure
    bpy.ops.mesh.primitive_cone_add(
        vertices=32,
        radius1=0.6,
        radius2=0.15,
        depth=2.0,
        location=(location[0], location[1], location[2] + 1.0)
    )
    body = bpy.context.active_object
    body.name = "Oracle_Body"
    body.parent = parent
    apply_material(body, "Oracle_Robe")

    # Head - smooth sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        radius=0.25,
        location=(location[0], location[1], location[2] + 2.2)
    )
    head = bpy.context.active_object
    head.name = "Oracle_Head"
    head.parent = parent
    apply_material(head, "Oracle_Robe")

    # Eyes - glowing orbs
    for i, offset in enumerate([(-0.08, -0.2, 0), (0.08, -0.2, 0)]):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16,
            ring_count=8,
            radius=0.04,
            location=(location[0] + offset[0], location[1] + offset[1], location[2] + 2.25 + offset[2])
        )
        eye = bpy.context.active_object
        eye.name = f"Oracle_Eye_{i}"
        eye.parent = parent
        apply_material(eye, "Oracle_Eyes")

    # Crystal crown - 5 floating crystals
    for i in range(5):
        angle = (i / 5) * math.pi * 2
        x = math.cos(angle) * 0.35
        y = math.sin(angle) * 0.35

        bpy.ops.mesh.primitive_cone_add(
            vertices=6,
            radius1=0.08,
            radius2=0.0,
            depth=0.25,
            location=(location[0] + x, location[1] + y, location[2] + 2.6)
        )
        crystal = bpy.context.active_object
        crystal.name = f"Oracle_Crystal_{i}"
        crystal.rotation_euler = (0, 0, angle)
        crystal.parent = parent
        apply_material(crystal, "Oracle_Crystal")

    # Central crystal above head
    bpy.ops.mesh.primitive_cone_add(
        vertices=8,
        radius1=0.12,
        radius2=0.0,
        depth=0.4,
        location=(location[0], location[1], location[2] + 2.8)
    )
    main_crystal = bpy.context.active_object
    main_crystal.name = "Oracle_MainCrystal"
    main_crystal.parent = parent
    apply_material(main_crystal, "Oracle_Crystal")

    # Staff
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16,
        radius=0.03,
        depth=2.5,
        location=(location[0] + 0.5, location[1], location[2] + 1.25)
    )
    staff = bpy.context.active_object
    staff.name = "Oracle_Staff"
    staff.parent = parent
    apply_material(staff, "Oracle_Gold")

    # Staff orb
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        radius=0.1,
        location=(location[0] + 0.5, location[1], location[2] + 2.6)
    )
    orb = bpy.context.active_object
    orb.name = "Oracle_Orb"
    orb.parent = parent
    apply_material(orb, "Oracle_Staff")

    print("✅ Created The Oracle")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# THE MIXER - Liquidity Coordinator
# Multi-armed entity with flowing liquid metal appendages
# ═══════════════════════════════════════════════════════════════════════════════

def create_mixer(location=(0, 0, 0)):
    """Create The Mixer character - Liquidity Coordinator"""

    parent = create_empty_parent("Mixer", location)

    # Core body - torus/ring shape
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.4,
        minor_radius=0.15,
        major_segments=48,
        minor_segments=12,
        location=(location[0], location[1], location[2] + 1.2)
    )
    body = bpy.context.active_object
    body.name = "Mixer_Body"
    body.parent = parent
    apply_material(body, "Mixer_Body")

    # Central core - glowing sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        radius=0.25,
        location=(location[0], location[1], location[2] + 1.2)
    )
    core = bpy.context.active_object
    core.name = "Mixer_Core"
    core.parent = parent
    apply_material(core, "Mixer_Core")

    # Multiple arms (6 arms) - curved cylinders
    for i in range(6):
        angle = (i / 6) * math.pi * 2
        x_dir = math.cos(angle)
        y_dir = math.sin(angle)

        # Arm base
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16,
            radius=0.06,
            depth=0.8,
            location=(
                location[0] + x_dir * 0.6,
                location[1] + y_dir * 0.6,
                location[2] + 1.2
            )
        )
        arm = bpy.context.active_object
        arm.name = f"Mixer_Arm_{i}"
        arm.rotation_euler = (0, math.pi / 4, angle)
        arm.parent = parent
        apply_material(arm, "Mixer_Arms")

        # Arm tip - small sphere
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12,
            ring_count=6,
            radius=0.08,
            location=(
                location[0] + x_dir * 1.0,
                location[1] + y_dir * 1.0,
                location[2] + 1.5
            )
        )
        tip = bpy.context.active_object
        tip.name = f"Mixer_Tip_{i}"
        tip.parent = parent
        apply_material(tip, "Mixer_Glow")

    # Flow rings around body
    for i, height in enumerate([0.8, 1.2, 1.6]):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.5 + i * 0.1,
            minor_radius=0.02,
            major_segments=32,
            minor_segments=8,
            location=(location[0], location[1], location[2] + height)
        )
        ring = bpy.context.active_object
        ring.name = f"Mixer_Ring_{i}"
        ring.parent = parent
        apply_material(ring, "Mixer_Flow")

    print("✅ Created The Mixer")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# THE WATCHER - Signal Processor
# Giant floating eye with sensor arrays
# ═══════════════════════════════════════════════════════════════════════════════

def create_watcher(location=(0, 0, 0)):
    """Create The Watcher character - Signal Processor"""

    parent = create_empty_parent("Watcher", location)

    # Main eye body - flattened sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=48,
        ring_count=24,
        radius=0.5,
        location=(location[0], location[1], location[2] + 1.5)
    )
    body = bpy.context.active_object
    body.name = "Watcher_Body"
    body.scale = (1.2, 0.6, 1.0)
    body.parent = parent
    apply_material(body, "Watcher_Shell")

    # Iris - inner ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.25,
        minor_radius=0.05,
        major_segments=32,
        minor_segments=8,
        location=(location[0], location[1] - 0.35, location[2] + 1.5)
    )
    iris = bpy.context.active_object
    iris.name = "Watcher_Iris"
    iris.rotation_euler = (math.pi / 2, 0, 0)
    iris.parent = parent
    apply_material(iris, "Watcher_Eye")

    # Pupil - glowing center
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24,
        ring_count=12,
        radius=0.15,
        location=(location[0], location[1] - 0.4, location[2] + 1.5)
    )
    pupil = bpy.context.active_object
    pupil.name = "Watcher_Pupil"
    pupil.parent = parent
    apply_material(pupil, "Watcher_Eye")

    # Sensor stalks around the eye
    for i in range(8):
        angle = (i / 8) * math.pi * 2
        x = math.cos(angle) * 0.55
        z = math.sin(angle) * 0.45

        # Stalk
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=8,
            radius=0.03,
            depth=0.3,
            location=(
                location[0] + x * 1.3,
                location[1],
                location[2] + 1.5 + z * 1.1
            )
        )
        stalk = bpy.context.active_object
        stalk.name = f"Watcher_Stalk_{i}"
        stalk.rotation_euler = (0, 0, angle)
        stalk.parent = parent
        apply_material(stalk, "Watcher_Shell")

        # Sensor tip
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12,
            ring_count=6,
            radius=0.06,
            location=(
                location[0] + x * 1.5,
                location[1],
                location[2] + 1.5 + z * 1.3
            )
        )
        sensor = bpy.context.active_object
        sensor.name = f"Watcher_Sensor_{i}"
        sensor.parent = parent
        apply_material(sensor, "Watcher_Sensor")

    # Scanning beam (cone)
    bpy.ops.mesh.primitive_cone_add(
        vertices=32,
        radius1=0.8,
        radius2=0.0,
        depth=2.0,
        location=(location[0], location[1] - 1.5, location[2] + 1.5)
    )
    beam = bpy.context.active_object
    beam.name = "Watcher_Beam"
    beam.rotation_euler = (math.pi / 2, 0, 0)
    beam.parent = parent
    apply_material(beam, "Watcher_Scan")

    print("✅ Created The Watcher")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# RECURSION ENGINE - Deep Analysis Engine
# Fractal-like entity with nested spiraling components
# ═══════════════════════════════════════════════════════════════════════════════

def create_recursion_engine(location=(0, 0, 0)):
    """Create the Recursion Engine character - Deep Analysis"""

    parent = create_empty_parent("RecursionEngine", location)

    # Central void sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        radius=0.3,
        location=(location[0], location[1], location[2] + 1.5)
    )
    core = bpy.context.active_object
    core.name = "Recursion_Core"
    core.parent = parent
    apply_material(core, "Recursion_Void")

    # Nested rings (7 levels for RALPH depth)
    for i in range(7):
        radius = 0.4 + i * 0.15
        rotation = (i * math.pi / 7, i * math.pi / 5, i * math.pi / 3)

        bpy.ops.mesh.primitive_torus_add(
            major_radius=radius,
            minor_radius=0.03,
            major_segments=48,
            minor_segments=8,
            location=(location[0], location[1], location[2] + 1.5)
        )
        ring = bpy.context.active_object
        ring.name = f"Recursion_Ring_{i}"
        ring.rotation_euler = rotation
        ring.parent = parent
        apply_material(ring, "Recursion_Rings")

    # Energy spirals
    for i in range(3):
        angle_offset = i * (math.pi * 2 / 3)

        for j in range(12):
            angle = angle_offset + j * 0.3
            radius = 0.8 + j * 0.05
            height = 1.5 + math.sin(j * 0.5) * 0.3

            bpy.ops.mesh.primitive_uv_sphere_add(
                segments=8,
                ring_count=4,
                radius=0.05 - j * 0.003,
                location=(
                    location[0] + math.cos(angle) * radius,
                    location[1] + math.sin(angle) * radius,
                    location[2] + height
                )
            )
            particle = bpy.context.active_object
            particle.name = f"Recursion_Particle_{i}_{j}"
            particle.parent = parent
            apply_material(particle, "Recursion_Spiral")

    # Inner glowing core
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24,
        ring_count=12,
        radius=0.15,
        location=(location[0], location[1], location[2] + 1.5)
    )
    inner = bpy.context.active_object
    inner.name = "Recursion_Inner"
    inner.parent = parent
    apply_material(inner, "Recursion_Core")

    print("✅ Created Recursion Engine")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# SCOUT - General Purpose Agent
# Sleek, aerodynamic delivery bot
# ═══════════════════════════════════════════════════════════════════════════════

def create_scout(location=(0, 0, 0), variant="standard"):
    """Create a Scout character - General Purpose Agent"""

    parent = create_empty_parent(f"Scout_{variant}", location)

    # Main body - elongated rounded shape
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        radius=0.3,
        location=(location[0], location[1], location[2] + 1.0)
    )
    body = bpy.context.active_object
    body.name = f"Scout_{variant}_Body"
    body.scale = (0.8, 1.5, 0.6)
    body.parent = parent
    apply_material(body, "Scout_Body")

    # Visor
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        radius=0.15,
        location=(location[0], location[1] - 0.35, location[2] + 1.1)
    )
    visor = bpy.context.active_object
    visor.name = f"Scout_{variant}_Visor"
    visor.scale = (1.5, 0.3, 0.8)
    visor.parent = parent
    apply_material(visor, "Scout_Visor")

    # Wings/fins
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(
            vertices=4,
            radius1=0.3,
            radius2=0.0,
            depth=0.05,
            location=(location[0] + side * 0.4, location[1], location[2] + 1.0)
        )
        wing = bpy.context.active_object
        wing.name = f"Scout_{variant}_Wing_{side}"
        wing.rotation_euler = (0, math.pi / 2, 0)
        wing.parent = parent
        apply_material(wing, "Scout_Body")

    # Thrusters
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16,
            radius=0.08,
            depth=0.15,
            location=(location[0] + side * 0.15, location[1] + 0.4, location[2] + 0.95)
        )
        thruster = bpy.context.active_object
        thruster.name = f"Scout_{variant}_Thruster_{side}"
        thruster.rotation_euler = (math.pi / 2, 0, 0)
        thruster.parent = parent
        apply_material(thruster, "Scout_Thruster")

    # Accent lights
    for i, pos in enumerate([(0, -0.4, 1.2), (-0.2, 0.2, 1.0), (0.2, 0.2, 1.0)]):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=8,
            ring_count=4,
            radius=0.03,
            location=(location[0] + pos[0], location[1] + pos[1], location[2] + pos[2])
        )
        light = bpy.context.active_object
        light.name = f"Scout_{variant}_Light_{i}"
        light.parent = parent
        apply_material(light, "Scout_Accent")

    print(f"✅ Created Scout ({variant})")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# DIAMOND HANDS - Vault Guardian
# Crystalline warrior figure
# ═══════════════════════════════════════════════════════════════════════════════

def create_diamond_hands(location=(0, 0, 0)):
    """Create Diamond Hands character - Vault Guardian"""

    parent = create_empty_parent("DiamondHands", location)

    # Torso - crystalline shape
    bpy.ops.mesh.primitive_cube_add(
        size=0.6,
        location=(location[0], location[1], location[2] + 1.3)
    )
    torso = bpy.context.active_object
    torso.name = "Diamond_Torso"
    torso.scale = (1.0, 0.6, 1.2)
    torso.rotation_euler = (0, 0, math.pi / 4)
    torso.parent = parent
    apply_material(torso, "Diamond_Crystal")

    # Head - diamond shape
    bpy.ops.mesh.primitive_cone_add(
        vertices=4,
        radius1=0.25,
        radius2=0.0,
        depth=0.3,
        location=(location[0], location[1], location[2] + 2.0)
    )
    head_top = bpy.context.active_object
    head_top.name = "Diamond_HeadTop"
    head_top.parent = parent
    apply_material(head_top, "Diamond_Crystal")

    bpy.ops.mesh.primitive_cone_add(
        vertices=4,
        radius1=0.25,
        radius2=0.0,
        depth=0.2,
        location=(location[0], location[1], location[2] + 1.75)
    )
    head_bot = bpy.context.active_object
    head_bot.name = "Diamond_HeadBot"
    head_bot.rotation_euler = (math.pi, 0, 0)
    head_bot.parent = parent
    apply_material(head_bot, "Diamond_Crystal")

    # Arms - crystalline shapes
    for side in [-1, 1]:
        # Upper arm
        bpy.ops.mesh.primitive_cube_add(
            size=0.15,
            location=(location[0] + side * 0.5, location[1], location[2] + 1.4)
        )
        upper_arm = bpy.context.active_object
        upper_arm.name = f"Diamond_UpperArm_{side}"
        upper_arm.scale = (1.0, 0.6, 2.5)
        upper_arm.parent = parent
        apply_material(upper_arm, "Diamond_Armor")

        # Diamond hand
        bpy.ops.mesh.primitive_cone_add(
            vertices=4,
            radius1=0.15,
            radius2=0.0,
            depth=0.3,
            location=(location[0] + side * 0.5, location[1], location[2] + 0.9)
        )
        hand = bpy.context.active_object
        hand.name = f"Diamond_Hand_{side}"
        hand.rotation_euler = (math.pi, 0, math.pi / 4)
        hand.parent = parent
        apply_material(hand, "Diamond_Gold")

    # Legs - pillars
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(
            size=0.12,
            location=(location[0] + side * 0.2, location[1], location[2] + 0.5)
        )
        leg = bpy.context.active_object
        leg.name = f"Diamond_Leg_{side}"
        leg.scale = (1.0, 0.8, 4.0)
        leg.parent = parent
        apply_material(leg, "Diamond_Armor")

    # Core glow
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        radius=0.15,
        location=(location[0], location[1], location[2] + 1.3)
    )
    core = bpy.context.active_object
    core.name = "Diamond_Core"
    core.parent = parent
    apply_material(core, "Diamond_Core")

    print("✅ Created Diamond Hands")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# DRONE - Helper Bot
# Small utility drone
# ═══════════════════════════════════════════════════════════════════════════════

def create_drone(location=(0, 0, 0)):
    """Create Drone character - Helper Bot"""

    parent = create_empty_parent("Drone", location)

    # Body - rounded cube
    bpy.ops.mesh.primitive_cube_add(
        size=0.3,
        location=(location[0], location[1], location[2] + 0.8)
    )
    body = bpy.context.active_object
    body.name = "Drone_Body"
    bpy.ops.object.modifier_add(type='SUBSURF')
    body.modifiers["Subdivision"].levels = 2
    body.parent = parent
    apply_material(body, "Drone_Shell")

    # Eye
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        radius=0.08,
        location=(location[0], location[1] - 0.15, location[2] + 0.85)
    )
    eye = bpy.context.active_object
    eye.name = "Drone_Eye"
    eye.parent = parent
    apply_material(eye, "Drone_Eye")

    # Propellers (4)
    for i, (x, y) in enumerate([(-0.2, -0.2), (0.2, -0.2), (-0.2, 0.2), (0.2, 0.2)]):
        # Arm
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=8,
            radius=0.02,
            depth=0.15,
            location=(location[0] + x * 0.7, location[1] + y * 0.7, location[2] + 0.9)
        )
        arm = bpy.context.active_object
        arm.name = f"Drone_Arm_{i}"
        arm.rotation_euler = (0, math.pi / 4, math.atan2(y, x))
        arm.parent = parent
        apply_material(arm, "Drone_Shell")

        # Rotor
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.1,
            minor_radius=0.01,
            major_segments=16,
            minor_segments=4,
            location=(location[0] + x, location[1] + y, location[2] + 0.95)
        )
        rotor = bpy.context.active_object
        rotor.name = f"Drone_Rotor_{i}"
        rotor.parent = parent
        apply_material(rotor, "Drone_Tool")

    # Tool arm
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=0.02,
        depth=0.25,
        location=(location[0], location[1], location[2] + 0.55)
    )
    tool = bpy.context.active_object
    tool.name = "Drone_Tool"
    tool.parent = parent
    apply_material(tool, "Drone_Tool")

    print("✅ Created Drone")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# TICK - Clockwork Creature
# Small clockwork/steampunk creature
# ═══════════════════════════════════════════════════════════════════════════════

def create_tick(location=(0, 0, 0)):
    """Create Tick character - Clockwork Creature"""

    parent = create_empty_parent("Tick", location)

    # Body - gear-like
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=0.2,
        depth=0.15,
        location=(location[0], location[1], location[2] + 0.5)
    )
    body = bpy.context.active_object
    body.name = "Tick_Body"
    body.parent = parent
    apply_material(body, "Tick_Brass")

    # Gear teeth around body
    for i in range(12):
        angle = (i / 12) * math.pi * 2
        x = math.cos(angle) * 0.22
        y = math.sin(angle) * 0.22

        bpy.ops.mesh.primitive_cube_add(
            size=0.05,
            location=(location[0] + x, location[1] + y, location[2] + 0.5)
        )
        tooth = bpy.context.active_object
        tooth.name = f"Tick_Tooth_{i}"
        tooth.rotation_euler = (0, 0, angle)
        tooth.parent = parent
        apply_material(tooth, "Tick_Gears")

    # Central crystal
    bpy.ops.mesh.primitive_cone_add(
        vertices=6,
        radius1=0.08,
        radius2=0.0,
        depth=0.15,
        location=(location[0], location[1], location[2] + 0.65)
    )
    crystal = bpy.context.active_object
    crystal.name = "Tick_Crystal"
    crystal.parent = parent
    apply_material(crystal, "Tick_Crystal")

    # Legs (6 spider-like)
    for i in range(6):
        angle = (i / 6) * math.pi * 2
        x_dir = math.cos(angle)
        y_dir = math.sin(angle)

        bpy.ops.mesh.primitive_cylinder_add(
            vertices=6,
            radius=0.015,
            depth=0.25,
            location=(
                location[0] + x_dir * 0.3,
                location[1] + y_dir * 0.3,
                location[2] + 0.35
            )
        )
        leg = bpy.context.active_object
        leg.name = f"Tick_Leg_{i}"
        leg.rotation_euler = (math.pi / 4, 0, angle)
        leg.parent = parent
        apply_material(leg, "Tick_Brass")

    # Clock hands
    bpy.ops.mesh.primitive_cube_add(
        size=0.02,
        location=(location[0], location[1], location[2] + 0.58)
    )
    hand1 = bpy.context.active_object
    hand1.name = "Tick_Hand1"
    hand1.scale = (5, 0.5, 0.2)
    hand1.parent = parent
    apply_material(hand1, "Tick_Gears")

    bpy.ops.mesh.primitive_cube_add(
        size=0.02,
        location=(location[0], location[1], location[2] + 0.59)
    )
    hand2 = bpy.context.active_object
    hand2.name = "Tick_Hand2"
    hand2.scale = (3.5, 0.5, 0.2)
    hand2.rotation_euler = (0, 0, math.pi / 3)
    hand2.parent = parent
    apply_material(hand2, "Tick_Gears")

    print("✅ Created Tick")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# PROTOCOL ARCHITECT - Hero Character
# Heroic figure with flowing cape and glowing armor
# ═══════════════════════════════════════════════════════════════════════════════

def create_protocol_architect(location=(0, 0, 0)):
    """Create Protocol Architect character - The Hero"""

    parent = create_empty_parent("ProtocolArchitect", location)

    # Torso - armored chest
    bpy.ops.mesh.primitive_cube_add(
        size=0.5,
        location=(location[0], location[1], location[2] + 1.4)
    )
    torso = bpy.context.active_object
    torso.name = "Architect_Torso"
    torso.scale = (1.2, 0.7, 1.0)
    bpy.ops.object.modifier_add(type='BEVEL')
    torso.modifiers["Bevel"].width = 0.02
    torso.parent = parent
    apply_material(torso, "Architect_Armor")

    # Head with visor
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        radius=0.2,
        location=(location[0], location[1], location[2] + 1.9)
    )
    head = bpy.context.active_object
    head.name = "Architect_Head"
    head.parent = parent
    apply_material(head, "Architect_Armor")

    # Visor
    bpy.ops.mesh.primitive_cube_add(
        size=0.15,
        location=(location[0], location[1] - 0.15, location[2] + 1.9)
    )
    visor = bpy.context.active_object
    visor.name = "Architect_Visor"
    visor.scale = (1.5, 0.3, 0.5)
    visor.parent = parent
    apply_material(visor, "Architect_Visor")

    # Shoulders
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16,
            ring_count=8,
            radius=0.15,
            location=(location[0] + side * 0.4, location[1], location[2] + 1.6)
        )
        shoulder = bpy.context.active_object
        shoulder.name = f"Architect_Shoulder_{side}"
        shoulder.scale = (1.2, 0.8, 1.0)
        shoulder.parent = parent
        apply_material(shoulder, "Architect_Gold")

    # Arms
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16,
            radius=0.08,
            depth=0.5,
            location=(location[0] + side * 0.5, location[1], location[2] + 1.2)
        )
        arm = bpy.context.active_object
        arm.name = f"Architect_Arm_{side}"
        arm.parent = parent
        apply_material(arm, "Architect_Armor")

    # Hands - glowing
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12,
            ring_count=6,
            radius=0.08,
            location=(location[0] + side * 0.5, location[1], location[2] + 0.9)
        )
        hand = bpy.context.active_object
        hand.name = f"Architect_Hand_{side}"
        hand.parent = parent
        apply_material(hand, "Architect_Core")

    # Legs
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16,
            radius=0.1,
            depth=0.8,
            location=(location[0] + side * 0.15, location[1], location[2] + 0.5)
        )
        leg = bpy.context.active_object
        leg.name = f"Architect_Leg_{side}"
        leg.parent = parent
        apply_material(leg, "Architect_Armor")

    # Cape
    bpy.ops.mesh.primitive_plane_add(
        size=1.0,
        location=(location[0], location[1] + 0.3, location[2] + 1.3)
    )
    cape = bpy.context.active_object
    cape.name = "Architect_Cape"
    cape.scale = (0.8, 1.2, 1.0)
    cape.rotation_euler = (0.3, 0, 0)
    bpy.ops.object.modifier_add(type='CLOTH')
    bpy.ops.object.modifier_add(type='SUBSURF')
    cape.modifiers["Subdivision"].levels = 2
    cape.parent = parent
    apply_material(cape, "Architect_Cape")

    # Chest core
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        radius=0.1,
        location=(location[0], location[1] - 0.25, location[2] + 1.4)
    )
    core = bpy.context.active_object
    core.name = "Architect_Core"
    core.parent = parent
    apply_material(core, "Architect_Core")

    # Halo
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.35,
        minor_radius=0.03,
        major_segments=32,
        minor_segments=8,
        location=(location[0], location[1], location[2] + 2.3)
    )
    halo = bpy.context.active_object
    halo.name = "Architect_Halo"
    halo.rotation_euler = (0.2, 0, 0)
    halo.parent = parent
    apply_material(halo, "Architect_Halo")

    print("✅ Created Protocol Architect")
    return parent


# ═══════════════════════════════════════════════════════════════════════════════
# CREATE ALL CHARACTERS
# ═══════════════════════════════════════════════════════════════════════════════

def create_all_characters():
    """Create all Ralph Town characters in a lineup"""

    positions = [
        (-8, 0, 0),   # Oracle
        (-6, 0, 0),   # Mixer
        (-4, 0, 0),   # Watcher
        (-2, 0, 0),   # Recursion
        (0, 0, 0),    # Scout
        (2, 0, 0),    # Diamond Hands
        (4, 0, 0),    # Drone
        (6, 0, 0),    # Tick
        (8, 0, 0),    # Architect
    ]

    create_oracle(positions[0])
    create_mixer(positions[1])
    create_watcher(positions[2])
    create_recursion_engine(positions[3])
    create_scout(positions[4])
    create_diamond_hands(positions[5])
    create_drone(positions[6])
    create_tick(positions[7])
    create_protocol_architect(positions[8])

    print("\n" + "═" * 50)
    print("✅ ALL RALPH TOWN CHARACTERS CREATED!")
    print("═" * 50)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # First run ralph_town_materials.py to create materials
    # Then run this to create characters
    create_all_characters()
