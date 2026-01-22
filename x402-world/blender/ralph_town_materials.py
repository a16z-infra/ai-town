"""
═══════════════════════════════════════════════════════════════════════════════
RALPH TOWN MATERIAL LIBRARY
Cyberpunk materials for X402 World characters and environment
Run this script in Blender to create all materials
═══════════════════════════════════════════════════════════════════════════════
"""

import bpy

# ═══════════════════════════════════════════════════════════════════════════════
# MATERIAL CREATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def create_emission_material(name, color, strength=5.0):
    """Create an emission material for glowing elements"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    emission = nodes.new('ShaderNodeEmission')

    emission.inputs['Color'].default_value = (*color, 1.0)
    emission.inputs['Strength'].default_value = strength

    output.location = (300, 0)
    emission.location = (0, 0)

    links.new(emission.outputs['Emission'], output.inputs['Surface'])

    return mat


def create_metallic_material(name, color, metallic=0.9, roughness=0.2):
    """Create a metallic material for robotic parts"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    principled = nodes.new('ShaderNodeBsdfPrincipled')

    principled.inputs['Base Color'].default_value = (*color, 1.0)
    principled.inputs['Metallic'].default_value = metallic
    principled.inputs['Roughness'].default_value = roughness

    output.location = (300, 0)
    principled.location = (0, 0)

    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    return mat


def create_glass_material(name, color, alpha=0.3):
    """Create a glass/holographic material"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    mix = nodes.new('ShaderNodeMixShader')
    glass = nodes.new('ShaderNodeBsdfGlass')
    emission = nodes.new('ShaderNodeEmission')

    glass.inputs['Color'].default_value = (*color, 1.0)
    glass.inputs['Roughness'].default_value = 0.1
    emission.inputs['Color'].default_value = (*color, 1.0)
    emission.inputs['Strength'].default_value = 2.0
    mix.inputs['Fac'].default_value = 0.5

    output.location = (500, 0)
    mix.location = (300, 0)
    glass.location = (0, 100)
    emission.location = (0, -100)

    links.new(glass.outputs['BSDF'], mix.inputs[1])
    links.new(emission.outputs['Emission'], mix.inputs[2])
    links.new(mix.outputs['Shader'], output.inputs['Surface'])

    return mat


def create_animated_emission(name, color1, color2, strength=5.0):
    """Create an animated pulsing emission material"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    emission = nodes.new('ShaderNodeEmission')
    mix_rgb = nodes.new('ShaderNodeMix')
    mix_rgb.data_type = 'RGBA'
    wave = nodes.new('ShaderNodeTexWave')
    mapping = nodes.new('ShaderNodeMapping')
    coord = nodes.new('ShaderNodeTexCoord')

    wave.wave_type = 'RINGS'
    wave.inputs['Scale'].default_value = 2.0
    wave.inputs['Distortion'].default_value = 5.0

    mix_rgb.inputs['A'].default_value = (*color1, 1.0)
    mix_rgb.inputs['B'].default_value = (*color2, 1.0)
    emission.inputs['Strength'].default_value = strength

    output.location = (600, 0)
    emission.location = (400, 0)
    mix_rgb.location = (200, 0)
    wave.location = (0, 0)
    mapping.location = (-200, 0)
    coord.location = (-400, 0)

    links.new(coord.outputs['Object'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    links.new(wave.outputs['Fac'], mix_rgb.inputs['Factor'])
    links.new(mix_rgb.outputs['Result'], emission.inputs['Color'])
    links.new(emission.outputs['Emission'], output.inputs['Surface'])

    return mat


# ═══════════════════════════════════════════════════════════════════════════════
# COLOR PALETTE
# ═══════════════════════════════════════════════════════════════════════════════

SOLANA_PURPLE = (0.6, 0.2, 0.9)
SOLANA_GREEN = (0.0, 1.0, 0.6)
SIGNAL_CYAN = (0.0, 0.9, 1.0)
ALERT_ORANGE = (1.0, 0.5, 0.0)
GOLD = (1.0, 0.84, 0.0)
VOID_BLACK = (0.02, 0.02, 0.05)
CHROME = (0.8, 0.8, 0.85)
CRIMSON = (0.9, 0.1, 0.2)
DEEP_PURPLE = (0.3, 0.1, 0.5)
DARK_GREEN = (0.1, 0.3, 0.2)
BRASS = (0.72, 0.45, 0.2)


# ═══════════════════════════════════════════════════════════════════════════════
# CREATE ALL MATERIALS
# ═══════════════════════════════════════════════════════════════════════════════

def create_all_materials():
    """Create the complete Ralph Town material library"""

    materials = {}

    # ═══════════════════════════════════════════════════════════════════════════
    # ORACLE MATERIALS (Purple theme - Chief Orchestrator)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['oracle_robe'] = create_metallic_material("Oracle_Robe", DEEP_PURPLE, metallic=0.3, roughness=0.6)
    materials['oracle_crystal'] = create_emission_material("Oracle_Crystal", SOLANA_PURPLE, strength=8.0)
    materials['oracle_eyes'] = create_emission_material("Oracle_Eyes", (1.0, 1.0, 1.0), strength=10.0)
    materials['oracle_gold'] = create_metallic_material("Oracle_Gold", GOLD, metallic=1.0, roughness=0.1)
    materials['oracle_staff'] = create_animated_emission("Oracle_Staff", SOLANA_PURPLE, SOLANA_GREEN, strength=6.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # MIXER MATERIALS (Green/Cyan theme - Liquidity Coordinator)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['mixer_body'] = create_metallic_material("Mixer_Body", DARK_GREEN, metallic=0.8, roughness=0.3)
    materials['mixer_glow'] = create_emission_material("Mixer_Glow", SOLANA_GREEN, strength=6.0)
    materials['mixer_arms'] = create_metallic_material("Mixer_Arms", CHROME, metallic=1.0, roughness=0.15)
    materials['mixer_core'] = create_emission_material("Mixer_Core", SIGNAL_CYAN, strength=12.0)
    materials['mixer_flow'] = create_animated_emission("Mixer_Flow", SOLANA_GREEN, SIGNAL_CYAN, strength=8.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # WATCHER MATERIALS (Cyan/surveillance theme - Signal Processor)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['watcher_shell'] = create_metallic_material("Watcher_Shell", (0.15, 0.15, 0.2), metallic=0.9, roughness=0.2)
    materials['watcher_eye'] = create_emission_material("Watcher_Eye", SIGNAL_CYAN, strength=15.0)
    materials['watcher_lens'] = create_glass_material("Watcher_Lens", SIGNAL_CYAN, alpha=0.4)
    materials['watcher_sensor'] = create_emission_material("Watcher_Sensor", SOLANA_GREEN, strength=4.0)
    materials['watcher_scan'] = create_animated_emission("Watcher_Scan", SIGNAL_CYAN, SOLANA_GREEN, strength=10.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # RECURSION ENGINE MATERIALS (Spiral/fractal theme - Deep Analysis)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['recursion_core'] = create_emission_material("Recursion_Core", SOLANA_PURPLE, strength=10.0)
    materials['recursion_rings'] = create_metallic_material("Recursion_Rings", CHROME, metallic=1.0, roughness=0.05)
    materials['recursion_void'] = create_metallic_material("Recursion_Void", VOID_BLACK, metallic=0.5, roughness=0.8)
    materials['recursion_energy'] = create_emission_material("Recursion_Energy", (0.8, 0.4, 1.0), strength=8.0)
    materials['recursion_spiral'] = create_animated_emission("Recursion_Spiral", SOLANA_PURPLE, (0.8, 0.4, 1.0), strength=12.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # SCOUT MATERIALS (Fast/light theme - General Purpose)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['scout_body'] = create_metallic_material("Scout_Body", (0.6, 0.6, 0.65), metallic=0.95, roughness=0.1)
    materials['scout_visor'] = create_glass_material("Scout_Visor", SOLANA_GREEN, alpha=0.5)
    materials['scout_thruster'] = create_emission_material("Scout_Thruster", ALERT_ORANGE, strength=8.0)
    materials['scout_accent'] = create_emission_material("Scout_Accent", SOLANA_GREEN, strength=4.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # DIAMOND HANDS MATERIALS (Crystalline/strong theme)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['diamond_crystal'] = create_glass_material("Diamond_Crystal", (0.9, 0.95, 1.0), alpha=0.2)
    materials['diamond_core'] = create_emission_material("Diamond_Core", (0.5, 0.8, 1.0), strength=6.0)
    materials['diamond_gold'] = create_metallic_material("Diamond_Gold", GOLD, metallic=1.0, roughness=0.05)
    materials['diamond_armor'] = create_metallic_material("Diamond_Armor", (0.7, 0.75, 0.8), metallic=1.0, roughness=0.15)

    # ═══════════════════════════════════════════════════════════════════════════
    # DRONE MATERIALS (Utility/worker theme)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['drone_shell'] = create_metallic_material("Drone_Shell", (0.4, 0.4, 0.45), metallic=0.8, roughness=0.4)
    materials['drone_eye'] = create_emission_material("Drone_Eye", SOLANA_GREEN, strength=5.0)
    materials['drone_tool'] = create_metallic_material("Drone_Tool", (0.3, 0.3, 0.35), metallic=0.9, roughness=0.3)

    # ═══════════════════════════════════════════════════════════════════════════
    # TICK MATERIALS (Clockwork theme)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['tick_brass'] = create_metallic_material("Tick_Brass", BRASS, metallic=1.0, roughness=0.3)
    materials['tick_gears'] = create_metallic_material("Tick_Gears", (0.6, 0.55, 0.5), metallic=0.9, roughness=0.4)
    materials['tick_crystal'] = create_emission_material("Tick_Crystal", SOLANA_PURPLE, strength=4.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # PROTOCOL ARCHITECT MATERIALS (Hero/leader theme)
    # ═══════════════════════════════════════════════════════════════════════════
    materials['architect_armor'] = create_metallic_material("Architect_Armor", (0.2, 0.15, 0.3), metallic=0.95, roughness=0.2)
    materials['architect_cape'] = create_metallic_material("Architect_Cape", SOLANA_PURPLE, metallic=0.2, roughness=0.7)
    materials['architect_visor'] = create_emission_material("Architect_Visor", SOLANA_GREEN, strength=8.0)
    materials['architect_core'] = create_emission_material("Architect_Core", (1.0, 0.9, 0.5), strength=12.0)
    materials['architect_gold'] = create_metallic_material("Architect_Gold", GOLD, metallic=1.0, roughness=0.1)
    materials['architect_halo'] = create_animated_emission("Architect_Halo", GOLD, SOLANA_PURPLE, strength=10.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # ENVIRONMENT MATERIALS
    # ═══════════════════════════════════════════════════════════════════════════
    materials['floor_grid'] = create_emission_material("Floor_Grid", SOLANA_PURPLE, strength=2.0)
    materials['floor_base'] = create_metallic_material("Floor_Base", VOID_BLACK, metallic=0.3, roughness=0.9)
    materials['wall_panel'] = create_metallic_material("Wall_Panel", (0.1, 0.1, 0.12), metallic=0.7, roughness=0.5)
    materials['energy_conduit'] = create_emission_material("Energy_Conduit", SOLANA_GREEN, strength=6.0)
    materials['hologram'] = create_glass_material("Hologram", SIGNAL_CYAN, alpha=0.6)
    materials['data_stream'] = create_animated_emission("Data_Stream", SOLANA_GREEN, SIGNAL_CYAN, strength=4.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # TRANSACTION EFFECT MATERIALS
    # ═══════════════════════════════════════════════════════════════════════════
    materials['tx_success'] = create_emission_material("TX_Success", SOLANA_GREEN, strength=15.0)
    materials['tx_pending'] = create_emission_material("TX_Pending", ALERT_ORANGE, strength=10.0)
    materials['tx_fail'] = create_emission_material("TX_Fail", CRIMSON, strength=12.0)
    materials['x402_payment'] = create_animated_emission("X402_Payment", SOLANA_GREEN, GOLD, strength=12.0)

    # ═══════════════════════════════════════════════════════════════════════════
    # ZONE-SPECIFIC MATERIALS
    # ═══════════════════════════════════════════════════════════════════════════
    materials['nexus_glow'] = create_emission_material("Nexus_Glow", SOLANA_PURPLE, strength=5.0)
    materials['exchange_glow'] = create_emission_material("Exchange_Glow", SOLANA_GREEN, strength=5.0)
    materials['forge_glow'] = create_emission_material("Forge_Glow", ALERT_ORANGE, strength=5.0)
    materials['archive_glow'] = create_emission_material("Archive_Glow", SIGNAL_CYAN, strength=5.0)
    materials['gateway_glow'] = create_emission_material("Gateway_Glow", GOLD, strength=5.0)
    materials['vault_glow'] = create_emission_material("Vault_Glow", (0.8, 0.7, 0.4), strength=5.0)
    materials['lab_glow'] = create_emission_material("Lab_Glow", (0.8, 0.4, 1.0), strength=5.0)
    materials['commons_glow'] = create_emission_material("Commons_Glow", (0.5, 0.5, 0.6), strength=3.0)

    print(f"✅ Material library created with {len(materials)} materials")
    return materials


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    create_all_materials()
