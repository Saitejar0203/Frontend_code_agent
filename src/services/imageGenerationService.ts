import { createScopedLogger } from '../lib/utils/logger';

const logger = createScopedLogger('ImageGenerationService');
import { addFileModification } from '../lib/stores/chatStore';
import type { WebContainer } from '@webcontainer/api';

export interface ImageGenerationRequest {
  localPath: string;
  description: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  path: string;
  image_base64?: string;
  enhanced_prompt?: string;
  error?: string;
  timestamp: string;
}

export interface BatchImageGenerationResponse {
  results: ImageGenerationResponse[];
  total_requested: number;
  successful: number;
  failed: number;
  timestamp: string;
}

class ImageGenerationService {
  private readonly apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_CODE_AGENT_URL || 'http://localhost:8002';
  }

  /**
   * Generate multiple images in parallel and mount them to WebContainer
   */
  async generateAndMountImages(requests: ImageGenerationRequest[], webcontainerInstance: WebContainer): Promise<void> {
    if (!requests || requests.length === 0) {
      logger.warn('[ImageGenerationService] No image requests provided');
      return;
    }

    logger.info(`[ImageGenerationService] Starting generation of ${requests.length} images`);

    try {
      if (!webcontainerInstance) {
        logger.error('[ImageGenerationService] WebContainer not provided');
        throw new Error('WebContainer not provided for image mounting');
      }

      // Make batch API call to backend
      const response = await this.callImageGenerationAPI(requests);
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const batchResult: BatchImageGenerationResponse = await response.json();
      logger.info(`[ImageGenerationService] Batch generation completed: ${batchResult.successful}/${batchResult.total_requested} successful`);

      // Process successful generations
      const successfulResults = batchResult.results.filter(result => result.success && result.image_base64);
      
      if (successfulResults.length > 0) {
        await this.mountImagesToWebContainer(successfulResults, webcontainerInstance);
      }

      // Log any failures
      const failedResults = batchResult.results.filter(result => !result.success);
      if (failedResults.length > 0) {
        logger.warn(`[ImageGenerationService] ${failedResults.length} images failed to generate:`);
        failedResults.forEach(result => {
          logger.warn(`  - ${result.path}: ${result.error}`);
        });
      }

    } catch (error) {
      logger.error('[ImageGenerationService] Error in generateAndMountImages:', error);
      throw error;
    }
  }

  /**
   * Make API call to backend for batch image generation
   */
  private async callImageGenerationAPI(requests: ImageGenerationRequest[]): Promise<Response> {
    const apiUrl = `${this.apiBaseUrl}/api/v1/images/generate-batch`;
    
    const requestBody = {
      images: requests.map(req => ({
        description: req.description,
        local_path: req.localPath,
        aspect_ratio: '1:1',
        guidance_scale: 7.0
      }))
    };

    logger.info(`[ImageGenerationService] Making API call to: ${apiUrl}`);
    
    return fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Mount generated images to WebContainer
   */
  private async mountImagesToWebContainer(results: ImageGenerationResponse[], webcontainerInstance: WebContainer): Promise<void> {
    if (!webcontainerInstance) {
      throw new Error('WebContainer not available for mounting images');
    }

    logger.info(`[ImageGenerationService] Mounting ${results.length} images to WebContainer`);

    try {
      for (const result of results) {
        try {
          // Convert base64 to binary data
          const binaryData = atob(result.image_base64!);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          
          // Ensure the directory exists before writing the file
          const directoryPath = result.path.substring(0, result.path.lastIndexOf('/'));
          if (directoryPath) {
            await webcontainerInstance.fs.mkdir(directoryPath, { recursive: true });
          }
          
          // Write file directly using fs.writeFile with Uint8Array
          await webcontainerInstance.fs.writeFile(result.path, bytes);
          
          logger.info(`[ImageGenerationService] Successfully wrote image: ${result.path}`);
          
          // Add file modification to chat store for UI updates
          addFileModification({
            path: result.path,
            type: 'create',
            content: `Generated image: ${result.path}`
          });
          
        } catch (error) {
          logger.error(`[ImageGenerationService] Error writing image ${result.path}:`, error);
        }
      }

      logger.info(`[ImageGenerationService] Completed mounting images to WebContainer`);

    } catch (error) {
      logger.error('[ImageGenerationService] Error mounting images to WebContainer:', error);
      throw error;
    }
  }

  /**
   * Health check for the image generation service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/images/health`);
      return response.ok;
    } catch (error) {
      logger.error('[ImageGenerationService] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;