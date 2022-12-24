/**
 * List of endpoints:
 *
 * get
 * add
 * remove
 

// Get tracks in the signed in user's Your Music library
spotifyApi
  .getMySavedTracks({
    limit: 2,
    offset: 1,
  })
  .then(
    function (data) {
      console.log("Done!");
    },
    function (err) {
      console.log("Something went wrong!\n", err);
    }
  );
// Remove tracks from the signed in user's Your Music library
spotifyApi.removeFromMySavedTracks(["3VNWq8rTnQG6fM1eldSpZ0"]).then(
  function (data) {
    console.log("Removed!");
  },
  function (err) {
    console.log("Something went wrong!\n", err);
  }
);

// Add tracks to the signed in user's Your Music library
spotifyApi.addToMySavedTracks(["3VNWq8rTnQG6fM1eldSpZ0"]).then(
  function (data) {
    console.log("Added track!");
  },
  function (err) {
    console.log("Something went wrong!\n", err);
  }
);

//module.exports = {};
*/
