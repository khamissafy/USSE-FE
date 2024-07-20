export function arraysContainSameObjects(arr1: any[], arr2: any[]): boolean {
    // Check if arrays have the same length
    if(arr1 && arr2){
        if (arr1.length !== arr2.length) {
            return false;
        }
    
        // Check if every object in arr1 exists in arr2
        return arr1.every(obj1 => {
            // Find an object in arr2 with the same ID
            const obj2 = arr2.find(obj => obj['id'] === obj1['id']);
            // Check if the object exists in arr2
            return obj2 !== undefined;
        });
    }
    else{
        return null
    }
   
}