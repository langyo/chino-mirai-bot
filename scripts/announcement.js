phase.load=(()=>{logger.info("Fetching Mirai Console Loader Announcement...");try{let e=loader.repo.fetchPackage("org.itxtech:mcl");logger.info("Mirai Console Loader Announcement:"),logger.println(e.announcement)}catch(e){logger.error("Failed to fetch announcement.")}});