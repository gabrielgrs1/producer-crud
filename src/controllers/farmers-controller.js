import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class FarmersController {
  static listFarmers = async (req, res) => {
    await prisma.farmer
      .findMany({
        include: {
          plantedCrops: true,
        },
      })
      .then((result) => {
        if (result != null && result.length > 0) {
          res.status(200).json(result);
        } else {
          res.status(404).json({
            message: `Nenhum produtor foi encontrado!`,
          });
        }
      })
      .catch((err) => {
        res.status(404).json({
          exception: `${err}`,
          message: "Nenhum produtor foi encontrado!",
        });
      });
  };

  static getFarmerPerId = async (req, res) => {
    const farmerId = parseInt(req.params.id);
    await prisma.farmer
      .findUnique({
        where: {
          id: farmerId,
        },
        include: {
          plantedCrops: true,
        },
      })
      .then((result) => {
        if (result != null) {
          res.status(200).json(result);
        } else {
          res.status(404).json({
            message: `Nenhum produtor foi encontrado!`,
          });
        }
      })
      .catch((err) => {
        res.status(404).json({
          exception: `${err}`,
          message: "Nenhum produtor foi encontrado!",
        });
      });
  };

  static registerFarmer = async (req, res) => {
    const farmerData = req.body;
    const cropData = farmerData.plantedCrops;

    if (
      farmerData.farmTotalArea <
      farmerData.arableArea + farmerData.vegetationArea
    ) {
      res.status(500).json({
        message: `Area total deve ser maior que a soma da Area de Vegetação e Area Agricultavel!`,
      });
    } else {
      await prisma.farmer
        .create({
          data: {
            document: farmerData.document,
            name: farmerData.name,
            farmName: farmerData.farmName,
            city: farmerData.city,
            state: farmerData.state,
            farmTotalArea: farmerData.farmTotalArea,
            arableArea: farmerData.arableArea,
            vegetationArea: farmerData.vegetationArea,
            plantedCrops: {
              create: {
                sugarCane: cropData.sugarCane,
                soy: cropData.soy,
                corn: cropData.corn,
                cotton: cropData.cotton,
                coffee: cropData.coffee,
              },
            },
          },
          include: {
            plantedCrops: true,
          },
        })
        .then((result) => {
          res.status(201).json(result);
        })
        .catch((err) => {
          res.status(500).json({
            exception: `${err}`,
            message: `Ocorreu um erro ao cadastrar o produtor, por favor tente novamente mais tarde!`,
          });
        });
    }
  };

  static updateFarmer = async (req, res) => {
    const farmerData = req.body;
    const farmerId = parseInt(req.params.id);
    const cropData = farmerData.plantedCrops;

    await prisma.farmer
      .update({
        where: { id: farmerId },
        data: {
          document: farmerData.document,
          name: farmerData.name,
          farmName: farmerData.farmName,
          city: farmerData.city,
          state: farmerData.state,
          farmTotalArea: farmerData.farmTotalArea,
          arableArea: farmerData.arableArea,
          vegetationArea: farmerData.vegetationArea,
          plantedCrops: {
            update: {
              sugarCane: cropData.sugarCane,
              soy: cropData.soy,
              corn: cropData.corn,
              cotton: cropData.cotton,
              coffee: cropData.coffee,
            },
          },
        },

        include: {
          plantedCrops: true,
        },
      })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res.status(500).json({
          exception: `${err}`,
          message: `Ocorreu um erro ao atualizar o produtor, por favor tente novamente mais tarde!`,
        });
      });
  };

  static deleteFarmer = async (req, res) => {
    const farmerId = parseInt(req.params.id);
    await prisma.farmer
      .delete({ where: { id: farmerId } })
      .then(() => {
        res.status(200).json({
          message: `Produtor rural excluído com sucesso!`,
        });
      })
      .catch((err) => {
        res.status(500).json({
          exception: `${err}`,
          message: `Ocorreu um erro ao excluir o produtor, por favor tente novamente mais tarde!`,
        });
      });
  };

  static getDashboard = async (req, res) => {
    const cropNameTranslations = {
      'cotton': 'Algodão',
      'coffee': 'Café',
      'corn': 'Milho',
      'soy': 'Soja',
      'sugarCane': 'Cana-de-açúcar',
    }

    await prisma.farmer
      .findMany({
        include: {
          plantedCrops: true,
        },
      })
      .then((result) => {
        let totalFarmersQuantity = result.length;
        let totalArableArea = 0;
        let totalFarmArea = 0;
        let totalVegetationArea = 0;
        let quantityFarmsPerState = {};
        let quantityFarmsPerCrop = {
          sugarCane: 0,
          soy: 0,
          corn: 0,
          cotton: 0,
          coffee: 0,
        };

        result.forEach((ruralProducer) => {
          totalArableArea += ruralProducer.arableArea;
          totalVegetationArea += ruralProducer.vegetationArea;
          totalFarmArea += ruralProducer.farmTotalArea;

          if (quantityFarmsPerState[ruralProducer.state]) {
            quantityFarmsPerState[ruralProducer.state]++;
          } else {
            quantityFarmsPerState[ruralProducer.state] = 1;
          }

          for (let crop in ruralProducer.plantedCrops) {
            if (ruralProducer.plantedCrops[crop] && crop != "id") {
              quantityFarmsPerCrop[crop]++;
            }
          }
        });

        let listFarmsPerState = Object.entries(quantityFarmsPerState).map(
          ([stateName, quantity]) => ({ stateName, quantity })
        );
        let listFarmPerCrop = Object.entries(quantityFarmsPerCrop).map(([cropName, quantity]) => {
          const translatedCropName = cropNameTranslations[cropName] || cropName;
          return { cropName: translatedCropName, quantity };
        });
        
        res.status(200).json({
          totalFarmersQuantity: totalFarmersQuantity,
          totalArableArea: totalArableArea,
          totalFarmArea: totalFarmArea,
          totalVegetationArea: totalVegetationArea,
          quantityFarmsPerState: listFarmsPerState,
          quantityFarmsPerCrop: listFarmPerCrop,
        });
      })
      .catch((err) => {
        res.status(404).json({
          exception: `${err}`,
          message:
            "Ocorreu um erro ao tentar buscar o dashboard! Tente novamente mais tarde!",
        });
      });
  };
}

export default FarmersController;
