const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Generate dynamic data based on a base seed
const generateRandomTrend = (base, variance, isPercentage = false) => {
    const change = (Math.random() * variance * 2) - variance;
    const val = Math.max(0, base + change);
    return isPercentage ? Math.min(100, val) : val;
};

const getStatusForHealth = (h) => {
    if (h > 80) return "healthy";
    if (h > 65) return "nutrient";
    if (h > 50) return "water";
    if (h > 40) return "pest";
    return "disease";
};

app.get('/api/farm/:stateId', (req, res) => {
    const { stateId } = req.params;
    
    // Config based on state
    let config = { crop: "Dragon Fruit", baseYield: 12, name: "Region Dashboard", imgKey: "dragonfruit", cropText: "Dragon Fruit Quality", cropSubtitle: "Computer-vision derived fruit morphology" };
    
    if (stateId === 'pb') config = { crop: "Wheat", baseYield: 5.5, name: "Punjab Wheat Belt", imgKey: "wheat", cropText: "Wheat Crop Quality", cropSubtitle: "AI kernel analysis & grain size morphology" };
    else if (stateId === 'mh') config = { crop: "Grapes", baseYield: 18, name: "Maharashtra Grape Orchards", imgKey: "grapes", cropText: "Grape Quality Index", cropSubtitle: "Canopy computer-vision cluster morphology" };
    else if (stateId === 'ka') config = { crop: "Coffee", baseYield: 2.2, name: "Karnataka Coffee Estates", imgKey: "coffee", cropText: "Coffee Bean Quality", cropSubtitle: "AI bean analysis" };
    else if (stateId === 'gj') config = { crop: "Cotton", baseYield: 4.5, name: "Gujarat Cotton Farms", "imgKey": "cotton", cropText: "Cotton Boll Quality", cropSubtitle: "Fiber strength and length analysis" };
    else if (stateId === 'up') config = { crop: "Sugarcane", baseYield: 80, name: "UP Sugarcane Belt", imgKey: "sugarcane", cropText: "Sugarcane Quality", cropSubtitle: "Sucrose content analysis" };

    // Generate dynamic KPI values
    const health = generateRandomTrend(80, 10, true);
    const ndvi = generateRandomTrend(0.7, 0.15);
    const predictedYield = generateRandomTrend(config.baseYield, config.baseYield * 0.1);
    const diseaseRisk = generateRandomTrend(15, 10, true);
    const waterStress = generateRandomTrend(30, 20, true);
    const harvestReady = generateRandomTrend(40, 20, true);
    const weatherRisk = generateRandomTrend(20, 15, true);

    const kpis = [
        { label: "Farm Health Score", value: Math.round(health), suffix: "/100", tone: "healthy", icon: "Leaf", trend: `+${(Math.random()*3).toFixed(1)}%`, spark: [70,75,Math.round(health)] },
        { label: "Canopy NDVI", value: ndvi.toFixed(2), suffix: " index", tone: "healthy", icon: "Sparkles", trend: `+${(Math.random()*0.05).toFixed(2)}`, spark: [0.6, 0.65, ndvi] },
        { label: "Predicted Yield", value: predictedYield.toFixed(1), suffix: " t/ha", tone: "healthy", icon: "TrendingUp", trend: `+${(Math.random()*0.5).toFixed(1)} t`, decimals: 1, spark: [config.baseYield - 1, config.baseYield, predictedYield] },
        { label: "Disease Risk", value: Math.round(diseaseRisk), suffix: "%", tone: "disease", icon: "Microscope", trend: `-${(Math.random()*5).toFixed(1)}%`, spark: [25, 20, Math.round(diseaseRisk)] },
        { label: "Water Stress", value: Math.round(waterStress), suffix: "%", tone: "water", icon: "Droplets", trend: `-${(Math.random()*5).toFixed(1)}%`, spark: [40, 35, Math.round(waterStress)] },
        { label: "Harvest Readiness", value: Math.round(harvestReady), suffix: "%", tone: "healthy", icon: "Wheat", trend: `+${(Math.random()*5).toFixed(1)}%`, spark: [20, 30, Math.round(harvestReady)] },
        { label: "Weather Risk", value: Math.round(weatherRisk), suffix: "%", tone: "nutrient", icon: "CloudSun", trend: `+${(Math.random()*2).toFixed(1)}%`, spark: [15, 18, Math.round(weatherRisk)] }
    ];

    // Generate fields
    const fields = ['A', 'B', 'C', 'D', 'E', 'F'].map((id, index) => {
        const fHealth = generateRandomTrend(85, 15, true);
        const fWater = generateRandomTrend(70, 20, true);
        const fDisease = generateRandomTrend(10, 8, true);
        const dominant = getStatusForHealth(fHealth - (fWater < 40 ? 20 : 0) - (fDisease > 20 ? 30 : 0));
        
        return {
            id,
            name: `Field ${id} — Zone ${index + 1}`,
            x: (index % 3) * 30 + 5,
            y: Math.floor(index / 3) * 35 + 10,
            w: 25,
            h: 25,
            dominant,
            health: Math.round(fHealth),
            disease: Math.round(fDisease),
            water: Math.round(fWater),
            yield: (predictedYield * (0.8 + Math.random()*0.4)).toFixed(1),
            stage: "Vegetative",
            harvestIn: Math.round(Math.random() * 60 + 10),
            rec: "AI generated recommendation based on live feed."
        };
    });

    const charts = {
        healthTrend: Array.from({ length: 14 }, (_, i) => ({
            d: `D${i + 1}`,
            health: Math.round(health + Math.sin(i)*5),
            yield: predictedYield,
            disease: Math.round(diseaseRisk + Math.cos(i)*2),
            pest: 10 + Math.sin(i)*3,
            water: Math.round(waterStress + Math.sin(i)*10)
        }))
    };

    const payload = {
        name: config.name,
        crop: config.crop,
        imgKey: config.imgKey,
        cropText: config.cropText,
        cropSubtitle: config.cropSubtitle,
        kpis,
        fields,
        charts,
        insights: [
            { tone: "info", text: `Live data stream active for ${config.name}.` },
            { tone: diseaseRisk > 20 ? "alert" : "good", text: `Disease risk is ${diseaseRisk > 20 ? 'elevated' : 'low'} across sectors.` }
        ]
    };

    res.json(payload);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
