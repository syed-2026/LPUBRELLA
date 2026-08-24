const stationRepository = require('../repositories/stationRepository');
const AppError = require('../utils/AppError');

const stationService = {
  async list({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [stations, total] = await Promise.all([
      stationRepository.list({ skip, take: limit, where: { status: 'ACTIVE' } }),
      stationRepository.count({ status: 'ACTIVE' }),
    ]);

    const withInventory = await Promise.all(
      stations.map(async (station) => ({
        ...station,
        inventory: await stationRepository.inventoryCounts(station.id),
      }))
    );

    return { stations: withInventory, total, page, limit };
  },

  async getById(id) {
    const station = await stationRepository.findById(id);
    if (!station) throw AppError.notFound('Station not found');
    const inventory = await stationRepository.inventoryCounts(id);
    return { ...station, inventory };
  },
};

module.exports = stationService;
